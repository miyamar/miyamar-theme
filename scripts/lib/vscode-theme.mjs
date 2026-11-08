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

function makeSemantic(semanticTokenColors = {}) {
  return (key) => {
    const v = semanticTokenColors[key];
    if (!v) return null;
    if (typeof v === "string") return { color: normalize(v), bold: false, italic: false, underline: false };
    if (!v.foreground) return null;
    return { color: normalize(v.foreground), bold: !!v.bold, italic: !!v.italic, underline: !!v.underline };
  };
}

/**
 * Syntax roles shared by every port.
 *
 * Which VS Code source a role comes from mirrors what you see editing TypeScript in
 * VS Code: the TypeScript server emits semantic tokens for identifiers (functions,
 * types, parameters, properties...), while keywords, strings, numbers, comments and
 * punctuation fall through to the TextMate rules.
 */
function buildSyntax(tm, sem, foreground) {
  const pick = (...candidates) => candidates.find(Boolean) ?? null;
  const fg = { color: foreground, bold: false, italic: false, underline: false };
  return {
    comment: tm("comment"),
    keyword: tm("keyword.control"),
    storage: pick(tm("storage.type"), tm("keyword.control")),
    operator: tm("keyword.operator"),
    punctuation: tm("punctuation"),
    string: tm("string"),
    stringEscape: pick(tm("constant.character.escape"), tm("string")),
    regexp: pick(sem("regexp"), tm("string.regexp"), tm("string")),
    number: tm("constant.numeric"),
    boolean: pick(tm("constant.language"), tm("constant.numeric")),
    constant: pick(sem("variable.readonly"), tm("support.constant"), tm("constant.language")),
    function: pick(sem("function"), tm("entity.name.function")),
    method: pick(sem("method"), sem("function"), tm("entity.name.function")),
    type: pick(sem("type"), tm("entity.name.type")),
    class: pick(sem("class"), sem("type"), tm("entity.name.class")),
    interface: pick(sem("interface"), sem("type"), tm("entity.name.type")),
    enum: pick(sem("enum"), sem("type"), tm("entity.name.type")),
    struct: pick(sem("struct"), sem("class"), tm("entity.name.type")),
    typeParameter: pick(sem("typeParameter"), sem("type"), tm("entity.name.type")),
    namespace: pick(sem("namespace"), sem("type"), tm("entity.name.type")),
    parameter: pick(sem("parameter"), tm("variable.parameter")),
    variable: pick(sem("variable"), tm("variable"), fg),
    property: pick(sem("property"), sem("variable"), tm("variable")),
    enumMember: pick(sem("enumMember"), tm("constant.numeric")),
    decorator: pick(sem("decorator"), tm("entity.name.function")),
    macro: pick(sem("macro"), tm("entity.name.function")),
    builtin: pick(tm("support.constant"), tm("support.variable")),
    tag: tm("entity.name.tag"),
    attribute: tm("entity.other.attribute-name"),
    invalid: tm("invalid"),
    heading: tm("markup.heading"),
    bold: tm("markup.bold"),
    italic: tm("markup.italic"),
    raw: tm("markup.inline.raw"),
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
    const sem = makeSemantic(vs.semanticTokenColors);

    return {
      id: slugFromPath(entry.path),
      label: entry.label,
      dark: entry.uiTheme !== "vs" && entry.type !== "light",
      color,
      solid,
      syntax: buildSyntax(tm, sem, color("editor.foreground", "foreground")),
    };
  });
}

export function writeFile(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : content + "\n");
  console.log("wrote " + rel);
}
