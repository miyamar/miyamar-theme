// Loads the hand-tuned VS Code themes (the source of truth) and exposes them in a
// shape the Zed and JetBrains generators can share.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

export const AUTHOR = pkg.author;
export const DESCRIPTION = pkg.description;
export const REPOSITORY = pkg.repository.replace(/\.git$/, "");

// ---------- color helpers ----------

function parseHex(hex) {
  const h = hex.replace("#", "");
  const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  };
}

const toHex2 = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/** Composite a (possibly translucent) color over an opaque background. Returns #RRGGBB. */
export function flatten(hex, over) {
  const fg = parseHex(hex);
  if (fg.a === 1) return "#" + toHex2(fg.r) + toHex2(fg.g) + toHex2(fg.b);
  const bg = parseHex(over);
  const mix = (f, b) => f * fg.a + b * (1 - fg.a);
  return "#" + toHex2(mix(fg.r, bg.r)) + toHex2(mix(fg.g, bg.g)) + toHex2(mix(fg.b, bg.b));
}

/** Replace a color's alpha channel. `alpha` is 0..1. */
export function withAlpha(hex, alpha) {
  const c = parseHex(hex);
  return "#" + toHex2(c.r) + toHex2(c.g) + toHex2(c.b) + toHex2(alpha * 255);
}

/** Opaque blend: `t` of `a` and `1 - t` of `b` (alpha ignored). */
export function mix(a, b, t) {
  const x = parseHex(a);
  const y = parseHex(b);
  const m = (p, q) => p * t + q * (1 - t);
  return "#" + toHex2(m(x.r, y.r)) + toHex2(m(x.g, y.g)) + toHex2(m(x.b, y.b));
}

/** Normalize to upper-case #RRGGBB or #RRGGBBAA. */
export function normalize(hex) {
  const c = parseHex(hex);
  const base = "#" + toHex2(c.r) + toHex2(c.g) + toHex2(c.b);
  return c.a === 1 ? base : base + toHex2(c.a * 255);
}

// ---------- theme loading ----------

function slugFromPath(p) {
  const base = path.basename(p, ".json").replace(/-(color-)?theme$/, "");
  // "pink-milky" reads better as "milky-pink"; keep ids stable from here on.
  return "miyamar-" + (base === "pink-milky" ? "milky-pink" : base);
}

function scopesOf(rule) {
  if (!rule.scope) return [];
  return (Array.isArray(rule.scope) ? rule.scope : rule.scope.split(","))
    .map((s) => s.trim());
}

/**
 * VS Code-style TextMate lookup: a rule scope matches when it equals the query
 * or is a dot-separated prefix of it; the longest match wins.
 */
function makeTextMate(tokenColors) {
  return (scope) => {
    let best = null;
    let bestLen = -1;
    for (const rule of tokenColors) {
      for (const s of scopesOf(rule)) {
        if (s.includes(" ")) continue; // descendant selectors are not portable
        if ((scope === s || scope.startsWith(s + ".")) && s.length > bestLen) {
          best = rule.settings;
          bestLen = s.length;
        }
      }
    }
    if (!best?.foreground) return null;
    const fs = best.fontStyle ?? "";
    return {
      color: normalize(best.foreground),
      bold: fs.includes("bold"),
      italic: fs.includes("italic"),
      underline: fs.includes("underline"),
    };
  };
}

/**
 * Syntax roles shared by every port, taken from the theme's TextMate `tokenColors`.
 *
 * Each role resolves the TextMate scopes VS Code itself falls back to for that kind
 * of token (its semantic-token-to-TextMate mapping), with the same longest-prefix
 * matching, so a role gets exactly the color VS Code would give it. Roles no rule
 * matches use the plain editor foreground, as in VS Code.
 */
function buildSyntax(tm, foreground) {
  const fg = { color: foreground, bold: false, italic: false, underline: false };
  /** First scope that some rule matches, else the editor foreground. */
  const scope = (...scopes) => {
    for (const s of scopes) {
      const r = tm(s);
      if (r) return r;
    }
    return fg;
  };
  return {
    comment: scope("comment"),
    keyword: scope("keyword.control"),
    storage: scope("storage.type"),
    operator: scope("keyword.operator"),
    punctuation: scope("punctuation"),
    bracket: scope("punctuation.definition.block"),
    string: scope("string"),
    stringEscape: scope("constant.character.escape"),
    regexp: scope("string.regexp"),
    number: scope("constant.numeric"),
    boolean: scope("constant.language"),
    constant: scope("variable.other.constant"),
    function: scope("entity.name.function"),
    method: scope("entity.name.function.member"),
    type: scope("entity.name.type"),
    class: scope("entity.name.type.class", "entity.name.class"),
    interface: scope("entity.name.type.interface"),
    enum: scope("entity.name.type.enum"),
    struct: scope("entity.name.type.struct"),
    typeParameter: scope("entity.name.type.parameter"),
    namespace: scope("entity.name.namespace"),
    parameter: scope("variable.parameter"),
    variable: scope("variable.other.readwrite"),
    property: scope("variable.other.property"),
    enumMember: scope("variable.other.enummember"),
    decorator: scope("entity.name.decorator", "entity.name.function"),
    macro: scope("entity.name.function.preprocessor"),
    builtin: scope("support.constant"),
    tag: scope("entity.name.tag"),
    attribute: scope("entity.other.attribute-name"),
    jsonKey: scope("support.type.property-name"),
    invalid: scope("invalid"),
    heading: scope("markup.heading"),
    bold: scope("markup.bold"),
    italic: scope("markup.italic"),
    raw: scope("markup.inline.raw"),
    link: tm("markup.underline.link"),
  };
}

/** Load every theme listed in package.json, in the order VS Code shows them. */
export function loadThemes() {
  return pkg.contributes.themes.map((entry) => {
    const file = path.join(ROOT, entry.path);
    const vs = JSON.parse(fs.readFileSync(file, "utf8"));
    const colors = vs.colors;

    /** First defined VS Code color among `keys` (normalized), or undefined. */
    const color = (...keys) => {
      for (const k of keys) if (colors[k]) return normalize(colors[k]);
      return undefined;
    };
    /** Like color(), but composited over `over` so it is fully opaque. */
    const solid = (over, ...keys) => {
      const c = color(...keys);
      return c && flatten(c, over);
    };

    const tm = makeTextMate(vs.tokenColors ?? []);

    return {
      id: slugFromPath(entry.path),
      label: entry.label,
      dark: entry.uiTheme !== "vs" && entry.type !== "light",
      color,
      solid,
      syntax: buildSyntax(tm, color("editor.foreground", "foreground")),
    };
  });
}

export function writeFile(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : content + "\n");
  console.log("wrote " + rel);
}
