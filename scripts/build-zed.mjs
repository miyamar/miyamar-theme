// Generates zed/themes/miyamar.json from the VS Code themes.
// Schema: https://zed.dev/schema/themes/v0.2.0.json
import fs from "node:fs";
import path from "node:path";
import { AUTHOR, ROOT, loadThemes, withAlpha, writeFile } from "./lib/vscode-theme.mjs";

const TRANSPARENT = "#00000000";

function highlight(role) {
  if (!role) return undefined;
  return {
    color: role.color,
    font_style: role.italic ? "italic" : null,
    font_weight: role.bold ? 700 : null,
  };
}

function syntax(s, fallbackLink) {
  const link = s.link ?? fallbackLink;
  const map = {
    attribute: s.attribute,
    boolean: s.boolean,
    comment: s.comment,
    "comment.doc": s.comment,
    constant: s.constant,
    constructor: s.class,
    embedded: s.variable,
    emphasis: s.italic,
    "emphasis.strong": s.bold,
    enum: s.enum,
    function: s.function,
    "function.builtin": s.builtin,
    "function.method": s.method,
    keyword: s.keyword,
    label: s.typeParameter,
    link_text: link,
    link_uri: link,
    module: s.namespace,
    namespace: s.namespace,
    number: s.number,
    operator: s.operator,
    preproc: s.macro,
    primary: s.variable,
    property: s.property,
    punctuation: s.punctuation,
    "punctuation.bracket": s.bracket,
    "punctuation.delimiter": s.punctuation,
    "punctuation.list_marker": s.punctuation,
    "punctuation.special": s.operator,
    string: s.string,
    "string.escape": s.stringEscape,
    "string.regex": s.regexp,
    "string.special": s.stringEscape,
    "string.special.symbol": s.enumMember,
    tag: s.tag,
    "text.literal": s.raw,
    title: s.heading,
    type: s.type,
    "type.builtin": s.type,
    "type.class": s.class,
    "type.interface": s.interface,
    variable: s.variable,
    "variable.parameter": s.parameter,
    "variable.special": s.variable,
    variant: s.enumMember,
  };
  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => v).map(([k, v]) => [k, highlight(v)]),
  );
}

function status(fg, bg) {
  return fg ? { fg, bg: bg ?? withAlpha(fg, 0.1), border: fg } : null;
}

function style(t) {
  const { color: c } = t;
  const brackets = [1, 2, 3, 4, 5, 6]
    .map((i) => c(`editorBracketHighlight.foreground${i}`))
    .filter(Boolean);

  const st = {
    background: c("sideBar.background"),
    "surface.background": c("sideBar.background"),
    "elevated_surface.background": c("menu.background", "editorWidget.background"),
    "panel.background": c("sideBar.background"),
    "panel.focused_border": c("focusBorder"),
    "panel.indent_guide": c("tree.indentGuidesStroke"),
    "panel.indent_guide_active": c("editorIndentGuide.activeBackground1", "tree.indentGuidesStroke"),
    "panel.indent_guide_hover": c("editorIndentGuide.activeBackground1", "tree.indentGuidesStroke"),
    "pane_group.border": c("editorGroup.border", "sideBar.border", "panel.border"),
    "drop_target.background": c("list.dropBackground", "sideBar.dropBackground"),

    border: c("panel.border", "sideBar.border"),
    "border.variant": c("tab.border", "sideBar.border"),
    "border.focused": c("focusBorder"),
    "border.selected": c("focusBorder"),
    "border.transparent": TRANSPARENT,
    "border.disabled": c("widget.border", "input.border"),

    text: c("foreground"),
    "text.muted": c("descriptionForeground"),
    "text.placeholder": c("input.placeholderForeground"),
    "text.disabled": c("disabledForeground"),
    "text.accent": c("textLink.foreground", "list.highlightForeground"),
    "link_text.hover": c("textLink.activeForeground", "editorLink.activeForeground"),

    icon: c("icon.foreground"),
    "icon.muted": c("tab.inactiveForeground", "descriptionForeground"),
    "icon.disabled": c("disabledForeground"),
    "icon.placeholder": c("input.placeholderForeground"),
    "icon.accent": c("list.highlightForeground", "textLink.foreground"),

    "element.background": c("button.secondaryBackground"),
    "element.hover": c("button.secondaryHoverBackground", "list.hoverBackground"),
    "element.active": c("list.activeSelectionBackground"),
    "element.selected": c("list.activeSelectionBackground"),
    "element.disabled": c("input.background"),
    "ghost_element.background": TRANSPARENT,
    "ghost_element.hover": c("list.hoverBackground"),
    "ghost_element.active": c("list.activeSelectionBackground"),
    "ghost_element.selected": c("list.inactiveSelectionBackground", "list.activeSelectionBackground"),
    "ghost_element.disabled": TRANSPARENT,

    "title_bar.background": c("titleBar.activeBackground"),
    "title_bar.inactive_background": c("titleBar.inactiveBackground", "titleBar.activeBackground"),
    "status_bar.background": c("statusBar.background"),
    "toolbar.background": c("breadcrumb.background", "editor.background"),
    "tab_bar.background": c("editorGroupHeader.tabsBackground", "tab.inactiveBackground"),
    "tab.inactive_background": c("tab.inactiveBackground"),
    "tab.active_background": c("tab.activeBackground"),
    "search.match_background": c("editor.findMatchHighlightBackground"),

    "scrollbar.thumb.background": c("scrollbarSlider.background"),
    "scrollbar.thumb.hover_background": c("scrollbarSlider.hoverBackground"),
    "scrollbar.thumb.border": TRANSPARENT,
    "scrollbar.track.background": TRANSPARENT,
    "scrollbar.track.border": c("editorOverviewRuler.border", "editor.background"),

    "editor.foreground": c("editor.foreground"),
    "editor.background": c("editor.background"),
    "editor.gutter.background": c("editorGutter.background", "editor.background"),
    "editor.subheader.background": c("sideBarSectionHeader.background", "editor.background"),
    "editor.active_line.background": c("editor.lineHighlightBackground"),
    "editor.highlighted_line.background": c("editor.rangeHighlightBackground", "editor.lineHighlightBackground"),
    "editor.line_number": c("editorLineNumber.foreground"),
    "editor.active_line_number": c("editorLineNumber.activeForeground"),
    "editor.invisible": c("editorWhitespace.foreground"),
    "editor.wrap_guide": c("editorRuler.foreground"),
    "editor.active_wrap_guide": c("editorIndentGuide.activeBackground1", "editorRuler.foreground"),
    "editor.indent_guide": c("editorIndentGuide.background1", "editorIndentGuide.background"),
    "editor.indent_guide_active": c("editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground"),
    "editor.document_highlight.read_background": c("editor.wordHighlightBackground"),
    "editor.document_highlight.write_background": c("editor.wordHighlightStrongBackground"),
    "editor.document_highlight.bracket_background": c("editorBracketMatch.background"),

    "terminal.background": c("terminal.background"),
    "terminal.ansi.background": c("terminal.background"),
    "terminal.foreground": c("terminal.foreground"),
    "terminal.bright_foreground": c("terminal.ansiBrightWhite"),
    "terminal.dim_foreground": c("descriptionForeground"),
  };

  for (const name of ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]) {
    const cap = name[0].toUpperCase() + name.slice(1);
    st[`terminal.ansi.${name}`] = c(`terminal.ansi${cap}`);
    st[`terminal.ansi.bright_${name}`] = c(`terminal.ansiBright${cap}`);
  }

  const statuses = {
    created: status(c("gitDecoration.addedResourceForeground"), c("diffEditor.insertedLineBackground")),
    deleted: status(c("gitDecoration.deletedResourceForeground"), c("diffEditor.removedLineBackground")),
    modified: status(c("gitDecoration.modifiedResourceForeground")),
    renamed: status(c("gitDecoration.untrackedResourceForeground")),
    conflict: status(c("gitDecoration.conflictingResourceForeground")),
    ignored: status(c("gitDecoration.ignoredResourceForeground")),
    error: status(c("editorError.foreground"), c("editorError.background")),
    warning: status(c("editorWarning.foreground"), c("editorWarning.background")),
    info: status(c("editorInfo.foreground"), c("editorInfo.background")),
    hint: status(c("editorHint.foreground", "editorInlayHint.foreground")),
    success: status(c("testing.iconPassed", "gitDecoration.addedResourceForeground")),
    predictive: status(c("editorInlayHint.foreground", "editorCodeLens.foreground")),
    hidden: status(c("disabledForeground")),
    unreachable: status(c("disabledForeground")),
  };
  for (const [name, s] of Object.entries(statuses)) {
    if (!s) continue;
    st[name] = s.fg;
    st[`${name}.background`] = s.bg;
    st[`${name}.border`] = s.border;
  }

  // Player 0 is you; the rest are collaborators, colored from the bracket palette.
  st.players = [
    {
      cursor: c("editorCursor.foreground"),
      background: c("editorCursor.foreground"),
      selection: c("editor.selectionBackground"),
    },
    ...brackets.map((b) => ({ cursor: b, background: b, selection: withAlpha(b, 0.24) })),
  ];
  st.accents = brackets;
  st.syntax = syntax(t.syntax, { color: c("textLink.foreground", "editorLink.activeForeground") });

  for (const k of Object.keys(st)) if (st[k] === undefined) delete st[k];
  return st;
}

const family = {
  $schema: "https://zed.dev/schema/themes/v0.2.0.json",
  name: "Miyamar",
  author: AUTHOR,
  themes: loadThemes().map((t) => ({
    name: t.label,
    appearance: t.dark ? "dark" : "light",
    style: style(t),
  })),
};

writeFile("zed/themes/miyamar.json", JSON.stringify(family, null, 2));
// Zed's extension registry requires a license file inside the extension directory.
writeFile("zed/LICENSE.md", fs.readFileSync(path.join(ROOT, "LICENSE.md"), "utf8"));
