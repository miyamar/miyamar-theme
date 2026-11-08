// Generates the JetBrains UI themes (*.theme.json) and editor color schemes (*.xml)
// under jetbrains/src/main/resources/themes from the VS Code themes, and registers
// them in plugin.xml.
import fs from "node:fs";
import path from "node:path";
import { AUTHOR, ROOT, flatten, loadThemes, mix, withAlpha, writeFile } from "./lib/vscode-theme.mjs";

const RES = "jetbrains/src/main/resources";

/**
 * Toolbar/action icon color. Light themes pull VS Code's grey icon color most of the
 * way toward the text color, since JetBrains' thin New UI icons read too faint in grey.
 */
function iconColor(t) {
  const icon = t.color("icon.foreground", "foreground");
  return t.dark ? icon : mix(t.color("foreground"), icon, 0.7);
}

// ---------- UI theme ----------

function uiTheme(t) {
  const { color: c } = t;
  const panel = c("sideBar.background");
  const editor = c("editor.background");
  // JetBrains UI colors are applied without blending, so composite translucent
  // VS Code colors over the surface they sit on.
  const sp = (...keys) => t.solid(panel, ...keys);
  const se = (...keys) => t.solid(editor, ...keys);

  const toolbar = c("titleBar.activeBackground");
  const toolbarFg = c("titleBar.activeForeground", "foreground");
  const toolbarHover = flatten(withAlpha(toolbarFg, 0.08), toolbar);
  const toolbarPressed = flatten(withAlpha(toolbarFg, 0.14), toolbar);
  const icons = iconColor(t);

  const border = c("panel.border", "sideBar.border");
  const selection = sp("list.activeSelectionBackground");
  const selectionInactive = sp("list.inactiveSelectionBackground");
  const hover = sp("list.hoverBackground");
  const input = { background: c("input.background"), foreground: c("input.foreground") };
  const list = {
    background: panel,
    foreground: c("sideBar.foreground", "foreground"),
    selectionBackground: selection,
    selectionForeground: c("list.activeSelectionForeground"),
    selectionInactiveBackground: selectionInactive,
    selectionInactiveForeground: c("list.inactiveSelectionForeground"),
    hoverBackground: hover,
  };
  const menu = {
    background: c("menu.background"),
    foreground: c("menu.foreground"),
    selectionBackground: c("menu.selectionBackground"),
    selectionForeground: c("menu.selectionForeground"),
    separatorColor: c("menu.separatorBackground"),
    borderColor: c("menu.border"),
  };
  const thumb = c("scrollbarSlider.background");
  const thumbHover = c("scrollbarSlider.hoverBackground");

  return {
    "*": {
      background: panel,
      foreground: c("foreground"),
      infoForeground: c("descriptionForeground"),
      disabledForeground: c("disabledForeground"),
      selectionBackground: selection,
      selectionForeground: c("list.activeSelectionForeground"),
      selectionInactiveBackground: selectionInactive,
      selectionBackgroundInactive: selectionInactive,
      hoverBackground: hover,
      borderColor: border,
      separatorColor: border,
      focusColor: c("focusBorder"),
      focusedBorderColor: c("focusBorder"),
      caretForeground: c("editorCursor.foreground"),
    },
    ActionButton: {
      hoverBackground: hover,
      pressedBackground: selection,
      hoverBorderColor: hover,
      pressedBorderColor: selection,
    },
    Button: {
      foreground: c("button.secondaryForeground"),
      startBackground: c("button.secondaryBackground"),
      endBackground: c("button.secondaryBackground"),
      startBorderColor: c("input.border", "button.secondaryBackground"),
      endBorderColor: c("input.border", "button.secondaryBackground"),
      focusedBorderColor: c("focusBorder"),
      "default.foreground": c("button.foreground"),
      "default.startBackground": c("button.background"),
      "default.endBackground": c("button.background"),
      "default.startBorderColor": c("button.background"),
      "default.endBorderColor": c("button.background"),
      "default.focusedBorderColor": c("focusBorder"),
    },
    ComboBox: {
      background: c("dropdown.background"),
      nonEditableBackground: c("dropdown.background"),
      foreground: c("dropdown.foreground"),
      selectionBackground: selection,
      selectionForeground: c("list.activeSelectionForeground"),
      "ArrowButton.background": c("dropdown.background"),
      "ArrowButton.nonEditableBackground": c("dropdown.background"),
    },
    CompletionPopup: {
      background: c("editorSuggestWidget.background"),
      foreground: c("editorSuggestWidget.foreground"),
      selectionBackground: c("editorSuggestWidget.selectedBackground"),
      selectionForeground: c("editorSuggestWidget.selectedForeground"),
      selectionInactiveBackground: c("editorSuggestWidget.selectedBackground"),
      matchForeground: c("editorSuggestWidget.highlightForeground"),
    },
    Component: {
      borderColor: c("input.border"),
      focusColor: c("focusBorder"),
      focusedBorderColor: c("focusBorder"),
      errorFocusColor: c("inputValidation.errorBorder", "editorError.foreground"),
      inactiveErrorFocusColor: c("inputValidation.errorBorder", "editorError.foreground"),
      warningFocusColor: c("inputValidation.warningBorder", "editorWarning.foreground"),
      inactiveWarningFocusColor: c("inputValidation.warningBorder", "editorWarning.foreground"),
    },
    Counter: {
      background: c("badge.background", "activityBarBadge.background"),
      foreground: c("badge.foreground", "activityBarBadge.foreground"),
    },
    DefaultTabs: {
      background: c("tab.inactiveBackground"),
      underlineColor: c("panelTitle.activeBorder", "focusBorder"),
      inactiveUnderlineColor: c("tab.unfocusedActiveBorderTop", "focusBorder"),
      hoverBackground: sp("tab.hoverBackground"),
      borderColor: c("tab.border"),
    },
    EditorPane: { background: editor },
    EditorTabs: {
      background: c("editorGroupHeader.tabsBackground", "tab.inactiveBackground"),
      underlinedTabBackground: c("tab.activeBackground"),
      underlinedTabForeground: c("tab.activeForeground"),
      underlineColor: c("tab.activeBorderTop", "focusBorder"),
      inactiveUnderlineColor: c("tab.unfocusedActiveBorderTop", "focusBorder"),
      hoverBackground: sp("tab.hoverBackground"),
      borderColor: c("tab.border"),
    },
    Link: {
      activeForeground: c("textLink.foreground", "editorLink.activeForeground"),
      hoverForeground: c("textLink.activeForeground", "editorLink.activeForeground"),
      pressedForeground: c("textLink.activeForeground", "editorLink.activeForeground"),
      visitedForeground: c("textLink.foreground", "editorLink.activeForeground"),
    },
    List: list,
    Tree: list,
    Table: { ...list, gridColor: border, stripeColor: panel },
    MainToolbar: {
      background: toolbar,
      inactiveBackground: c("titleBar.inactiveBackground", "titleBar.activeBackground"),
      foreground: toolbarFg,
      separatorColor: c("titleBar.border", "panel.border"),
      borderColor: c("titleBar.border", "panel.border"),
      "Icon.background": toolbar,
      "Icon.hoverBackground": toolbarHover,
      "Icon.pressedBackground": toolbarPressed,
      "Dropdown.foreground": toolbarFg,
      "Dropdown.background": toolbar,
      "Dropdown.hoverBackground": toolbarHover,
      "Dropdown.pressedBackground": toolbarPressed,
      "Dropdown.transparentHoverBackground": withAlpha(toolbarFg, 0.08),
    },
    // The run/debug/build controls and their "more" menu live here. JetBrains'
    // defaults assume a dark header and paint them near-white.
    RunWidget: {
      foreground: toolbarFg,
      iconColor: icons,
      runIconColor: c("testing.iconPassed", "terminal.ansiGreen"),
      runningIconColor: toolbarFg,
      hoverBackground: toolbarHover,
      pressedBackground: toolbarPressed,
    },
    TitlePane: {
      background: c("titleBar.activeBackground"),
      inactiveBackground: c("titleBar.inactiveBackground", "titleBar.activeBackground"),
    },
    Menu: menu,
    MenuBar: { ...menu, background: c("titleBar.activeBackground") },
    MenuItem: menu,
    PopupMenu: menu,
    Notification: {
      background: c("notifications.background"),
      foreground: c("notifications.foreground"),
      borderColor: c("notifications.border"),
    },
    Panel: { background: panel },
    SidePanel: { background: panel },
    Popup: {
      background: c("editorWidget.background", "menu.background"),
      borderColor: c("editorWidget.border", "widget.border"),
      inactiveBorderColor: c("editorWidget.border", "widget.border"),
      "Header.activeBackground": c("sideBarSectionHeader.background", "editorWidget.background"),
      "Header.inactiveBackground": c("sideBarSectionHeader.background", "editorWidget.background"),
      separatorColor: c("editorWidget.border", "widget.border"),
    },
    ProgressBar: {
      progressColor: c("progressBar.background"),
      indeterminateStartColor: c("progressBar.background"),
      indeterminateEndColor: c("button.secondaryBackground"),
      trackColor: c("input.background"),
    },
    ScrollBar: {
      trackColor: "#00000000",
      hoverTrackColor: "#00000000",
      thumbColor: thumb,
      hoverThumbColor: thumbHover,
      thumbBorderColor: thumb,
      hoverThumbBorderColor: thumbHover,
      "Mac.trackColor": "#00000000",
      "Mac.hoverTrackColor": "#00000000",
      "Mac.thumbColor": thumb,
      "Mac.hoverThumbColor": thumbHover,
      "Mac.thumbBorderColor": thumb,
      "Mac.hoverThumbBorderColor": thumbHover,
      "Mac.Transparent.thumbColor": thumb,
      "Mac.Transparent.hoverThumbColor": thumbHover,
      "Transparent.thumbColor": thumb,
      "Transparent.hoverThumbColor": thumbHover,
    },
    SearchEverywhere: {
      "Header.background": c("editorWidget.background", "menu.background"),
      "Tab.selectedBackground": selection,
      "SearchField.background": c("input.background"),
      "SearchField.borderColor": c("input.border"),
    },
    SearchMatch: {
      startBackground: se("editor.findMatchBackground"),
      endBackground: se("editor.findMatchBackground"),
    },
    Separator: { separatorColor: border },
    StatusBar: {
      background: c("statusBar.background"),
      borderColor: c("statusBar.border"),
      "Widget.hoverBackground": c("statusBarItem.hoverBackground"),
      "Widget.pressedBackground": c("statusBarItem.activeBackground"),
    },
    TabbedPane: {
      underlineColor: c("panelTitle.activeBorder", "focusBorder"),
      focusColor: sp("list.hoverBackground"),
      hoverColor: sp("list.hoverBackground"),
      contentAreaColor: border,
    },
    TextArea: input,
    TextField: input,
    PasswordField: input,
    FormattedTextField: input,
    ToolTip: {
      background: c("editorHoverWidget.background"),
      foreground: c("editorHoverWidget.foreground", "foreground"),
      borderColor: c("editorHoverWidget.border"),
    },
    ToolWindow: {
      background: panel,
      "Header.background": c("sideBarSectionHeader.background", "sideBar.background"),
      "Header.inactiveBackground": c("sideBarSectionHeader.background", "sideBar.background"),
      "HeaderTab.selectedInactiveBackground": selectionInactive,
      "HeaderTab.hoverBackground": hover,
      // The left/right tool window stripes sit beside the project view, so they take
      // the file explorer's color rather than VS Code's (often much stronger)
      // activity bar color.
      "Stripe.background": panel,
      "Stripe.borderColor": border,
      "Stripe.separatorColor": border,
      "Button.foreground": icons,
      "Button.selectedForeground": c("foreground"),
      "Button.selectedBackground": selectionInactive,
      "Button.hoverBackground": hover,
    },
  };
}

/** New UI icon recoloring. Gray.Stroke is the grey (#6C707E) of light-theme icons. */
function iconPalette(t) {
  return t.dark ? undefined : { ColorPalette: { "Gray.Stroke": iconColor(t) } };
}

function prune(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) delete obj[k];
    else if (v && typeof v === "object") prune(v);
  }
  return obj;
}

// ---------- editor color scheme ----------

const hex = (h) => (h ? h.replace("#", "").slice(0, 6) : "");
const FONT = (r) => (r ? (r.bold ? 1 : 0) | (r.italic ? 2 : 0) : 0);
// EFFECT_TYPE values used by IntelliJ scheme files.
const EFFECT = { boxed: 0, underline: 1, wave: 2, strikeout: 3 };

// Language-specific keys that the bundled Darcula/Default schemes (and their plugin
// add-ons) give hard-coded colors. Left alone, those would win over our DEFAULT_*
// colors; baseAttributes makes them follow the language default instead, the same
// way JetBrains' own New UI schemes do.
const INHERIT = {
  // Java / Kotlin / Groovy / Scala
  INSTANCE_FIELD_ATTRIBUTES: "DEFAULT_INSTANCE_FIELD",
  STATIC_FIELD_ATTRIBUTES: "DEFAULT_STATIC_FIELD",
  STATIC_FINAL_FIELD_ATTRIBUTES: "DEFAULT_CONSTANT",
  STATIC_METHOD_ATTRIBUTES: "DEFAULT_STATIC_METHOD",
  ANNOTATION_NAME_ATTRIBUTES: "DEFAULT_METADATA",
  ANNOTATION_ATTRIBUTE_NAME_ATTRIBUTES: "DEFAULT_PARAMETER",
  IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES: "DEFAULT_PARAMETER",
  KOTLIN_LABEL: "DEFAULT_LABEL",
  KOTLIN_MUTABLE_VARIABLE: "DEFAULT_LOCAL_VARIABLE",
  KOTLIN_NAMED_ARGUMENT: "DEFAULT_IDENTIFIER",
  KOTLIN_SMART_CONSTANT: "DEFAULT_CONSTANT",
  KOTLIN_TYPE_PARAMETER: "TYPE_PARAMETER_NAME_ATTRIBUTES",
  IntelliJComposableCallTextAttributes: "DEFAULT_FUNCTION_CALL",
  GROOVY_KEYWORD: "DEFAULT_KEYWORD",
  "Groovy method declaration": "DEFAULT_FUNCTION_DECLARATION",
  "Instance property reference ID": "DEFAULT_INSTANCE_FIELD",
  "Static property reference ID": "DEFAULT_STATIC_FIELD",
  "Static method access": "DEFAULT_STATIC_METHOD",
  Class: "DEFAULT_CLASS_REFERENCE",
  "Scala Type Alias": "DEFAULT_CLASS_NAME",
  "Scala Type parameter": "TYPE_PARAMETER_NAME_ATTRIBUTES",
  // JavaScript / TypeScript / Angular
  "JS.GLOBAL_FUNCTION": "DEFAULT_FUNCTION_DECLARATION",
  "JS.GLOBAL_VARIABLE": "DEFAULT_GLOBAL_VARIABLE",
  "JS.INSTANCE_MEMBER_FUNCTION": "DEFAULT_INSTANCE_METHOD",
  "JS.LOCAL_VARIABLE": "DEFAULT_LOCAL_VARIABLE",
  "COFFEESCRIPT.GLOBAL_VARIABLE": "DEFAULT_GLOBAL_VARIABLE",
  "NG.SIGNAL": "DEFAULT_FUNCTION_CALL",
  // Python
  "PY.BUILTIN_NAME": "DEFAULT_PREDEFINED_SYMBOL",
  "PY.KEYWORD_ARGUMENT": "DEFAULT_IDENTIFIER",
  "PY.PREDEFINED_DEFINITION": "DEFAULT_FUNCTION_DECLARATION",
  "PY.PREDEFINED_USAGE": "DEFAULT_FUNCTION_CALL",
  "PY.SELF_PARAMETER": "DEFAULT_PARAMETER",
  "PY.STRING.B": "DEFAULT_STRING",
  // Go
  GO_BUILTIN_CONSTANT: "DEFAULT_CONSTANT",
  GO_BUILTIN_FUNCTION_CALL: "DEFAULT_FUNCTION_CALL",
  GO_BUILTIN_TYPE_REFERENCE: "DEFAULT_CLASS_REFERENCE",
  GO_BUILTIN_VARIABLE: "DEFAULT_GLOBAL_VARIABLE",
  GO_COMMENT_REFERENCE: "DEFAULT_DOC_COMMENT_TAG_VALUE",
  GO_EXPORTED_FUNCTION: "DEFAULT_FUNCTION_DECLARATION",
  GO_EXPORTED_FUNCTION_CALL: "DEFAULT_FUNCTION_CALL",
  GO_LOCAL_CONSTANT: "DEFAULT_CONSTANT",
  GO_LOCAL_FUNCTION: "DEFAULT_FUNCTION_DECLARATION",
  GO_LOCAL_FUNCTION_CALL: "DEFAULT_FUNCTION_CALL",
  GO_METHOD_RECEIVER: "DEFAULT_PARAMETER",
  GO_PACKAGE: "DEFAULT_IDENTIFIER",
  GO_PACKAGE_EXPORTED_CONSTANT: "DEFAULT_CONSTANT",
  GO_PACKAGE_LOCAL_CONSTANT: "DEFAULT_CONSTANT",
  GO_SHADOWING_VARIABLE: "DEFAULT_LOCAL_VARIABLE",
  GO_TYPE_REFERENCE: "DEFAULT_CLASS_REFERENCE",
  // Markup
  HTML_ATTRIBUTE_NAME: "DEFAULT_ATTRIBUTE",
  HTML_ATTRIBUTE_VALUE: "DEFAULT_STRING",
  HTML_TAG_NAME: "DEFAULT_TAG",
  HTML_CUSTOM_TAG_NAME: "DEFAULT_TAG",
  HTML_ENTITY_REFERENCE: "DEFAULT_ENTITY",
  XML_ATTRIBUTE_NAME: "DEFAULT_ATTRIBUTE",
  XML_TAG_NAME: "DEFAULT_TAG",
  XML_CUSTOM_TAG_NAME: "DEFAULT_TAG",
  XML_ENTITY_REFERENCE: "DEFAULT_ENTITY",
  XML_PROLOGUE: "DEFAULT_KEYWORD",
  JSP_DIRECTIVE_NAME: "DEFAULT_KEYWORD",
  HAML_TAG: "DEFAULT_TAG",
  HAML_CLASS: "DEFAULT_ATTRIBUTE",
  HAML_ID: "DEFAULT_ATTRIBUTE",
  HAML_COMMENT: "DEFAULT_LINE_COMMENT",
  // Stylesheets
  "CSS.COLOR": "DEFAULT_NUMBER",
  "CSS.IMPORTANT": "DEFAULT_KEYWORD",
  "CSS.URL": "DEFAULT_STRING",
  LESS_VARIABLE: "DEFAULT_LOCAL_VARIABLE",
  SASS_VARIABLE: "DEFAULT_LOCAL_VARIABLE",
  SASS_ATTRIBUTE: "DEFAULT_INSTANCE_FIELD",
  SASS_COMMENT: "DEFAULT_BLOCK_COMMENT",
  SASS_CONSTANT: "DEFAULT_CONSTANT",
  SASS_DIRECTIVE: "DEFAULT_KEYWORD",
  SASS_RULE: "DEFAULT_KEYWORD",
  SASS_MIXIN: "DEFAULT_FUNCTION_CALL",
  // Data / config
  YAML_ANCHOR: "DEFAULT_CONSTANT",
  "PROPERTIES.KEY": "DEFAULT_INSTANCE_FIELD",
  "PROPERTIES.KEY_VALUE_SEPARATOR": "DEFAULT_OPERATION_SIGN",
  "PROPERTIES.VALID_STRING_ESCAPE": "DEFAULT_VALID_STRING_ESCAPE",
  "PROPERTIES.INVALID_STRING_ESCAPE": "DEFAULT_INVALID_STRING_ESCAPE",
  // Regular expressions
  "REGEXP.BRACES": "JS.REGEXP",
  "REGEXP.BRACKETS": "JS.REGEXP",
  "REGEXP.PARENTHS": "JS.REGEXP",
  "REGEXP.CHAR_CLASS": "JS.REGEXP",
  "REGEXP.META": "JS.REGEXP",
  "REGEXP.ESC_CHARACTER": "DEFAULT_VALID_STRING_ESCAPE",
  "REGEXP.QUOTE_CHARACTER": "DEFAULT_VALID_STRING_ESCAPE",
  "REGEXP.REDUNDANT_ESCAPE": "DEFAULT_VALID_STRING_ESCAPE",
  // Mermaid
  MERMAID_KEYWORD: "DEFAULT_KEYWORD",
  MERMAID_CONSTANT: "DEFAULT_CONSTANT",
  MERMAID_IDENTIFIER: "DEFAULT_IDENTIFIER",
  MERMAID_EDGE: "DEFAULT_OPERATION_SIGN",
  MERMAID_DIAGRAM_NAME: "DEFAULT_KEYWORD",
  MERMAID_TITLE: "DEFAULT_KEYWORD",
};

function scheme(t) {
  const { color: c, syntax: s } = t;
  const editor = c("editor.background");
  const se = (...keys) => t.solid(editor, ...keys);
  // An opaque tint of a VS Code color, as if drawn at `alpha` over the editor.
  const tint = (key, alpha) => c(key) && flatten(withAlpha(c(key), alpha), editor);
  const link = s.link ?? { color: c("textLink.foreground", "editorLink.activeForeground") };

  const colors = {
    CARET_COLOR: c("editorCursor.foreground"),
    CARET_ROW_COLOR: se("editor.lineHighlightBackground"),
    SELECTION_BACKGROUND: se("editor.selectionBackground"),
    SELECTION_FOREGROUND: "",
    GUTTER_BACKGROUND: c("editorGutter.background", "editor.background"),
    LINE_NUMBERS_COLOR: c("editorLineNumber.foreground"),
    LINE_NUMBER_ON_CARET_ROW_COLOR: c("editorLineNumber.activeForeground"),
    INDENT_GUIDE: se("editorIndentGuide.background1", "editorIndentGuide.background"),
    SELECTED_INDENT_GUIDE: se("editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground"),
    RIGHT_MARGIN_COLOR: se("editorRuler.foreground"),
    WHITESPACES: se("editorWhitespace.foreground"),
    SOFT_WRAP_SIGN_COLOR: se("editorWhitespace.foreground"),
    TEARLINE_COLOR: c("panel.border", "sideBar.border"),
    SELECTED_TEARLINE_COLOR: c("focusBorder"),
    METHOD_SEPARATORS_COLOR: c("panel.border", "sideBar.border"),
    ADDED_LINES_COLOR: c("editorGutter.addedBackground"),
    MODIFIED_LINES_COLOR: c("editorGutter.modifiedBackground"),
    DELETED_LINES_COLOR: c("editorGutter.deletedBackground"),
    WHITESPACES_MODIFIED_LINES_COLOR: c("editorGutter.modifiedBackground"),
    ANNOTATIONS_COLOR: c("editorLineNumber.foreground"),
    CONSOLE_BACKGROUND_KEY: c("terminal.background"),
    DOCUMENTATION_COLOR: c("editorHoverWidget.background"),
    LOOKUP_COLOR: c("editorSuggestWidget.background"),
    NOTIFICATION_BACKGROUND: c("notifications.background"),
    FILESTATUS_ADDED: c("gitDecoration.addedResourceForeground"),
    FILESTATUS_MODIFIED: c("gitDecoration.modifiedResourceForeground"),
    FILESTATUS_DELETED: c("gitDecoration.deletedResourceForeground"),
    FILESTATUS_UNKNOWN: c("gitDecoration.untrackedResourceForeground"),
    FILESTATUS_IDEA_FILESTATUS_IGNORED: c("gitDecoration.ignoredResourceForeground"),
    FILESTATUS_MERGED: c("gitDecoration.conflictingResourceForeground"),
  };

  const fg = (role, extra = {}) => role && { FOREGROUND: role.color, FONT_TYPE: FONT(role), ...extra };
  const bg = (color, extra = {}) => color && { BACKGROUND: color, ...extra };
  const effect = (color, type, extra = {}) =>
    color && { EFFECT_COLOR: color, EFFECT_TYPE: EFFECT[type], ...extra };

  const err = c("editorError.foreground");
  const warn = c("editorWarning.foreground");
  const info = c("editorInfo.foreground");

  const attributes = {
    TEXT: { FOREGROUND: c("editor.foreground"), BACKGROUND: editor },

    DEFAULT_KEYWORD: fg(s.keyword),
    DEFAULT_STRING: fg(s.string),
    DEFAULT_VALID_STRING_ESCAPE: fg(s.stringEscape),
    DEFAULT_INVALID_STRING_ESCAPE: fg(s.invalid, effect(err, "wave")),
    DEFAULT_NUMBER: fg(s.number),
    DEFAULT_CONSTANT: fg(s.constant),
    DEFAULT_PREDEFINED_SYMBOL: fg(s.builtin),
    DEFAULT_LINE_COMMENT: fg(s.comment),
    DEFAULT_BLOCK_COMMENT: fg(s.comment),
    DEFAULT_DOC_COMMENT: fg(s.comment),
    DEFAULT_DOC_COMMENT_TAG: fg(s.comment && { ...s.comment, bold: true }),
    DEFAULT_DOC_COMMENT_TAG_VALUE: fg(s.parameter),
    DEFAULT_DOC_MARKUP: fg(s.comment),
    DEFAULT_OPERATION_SIGN: fg(s.operator),
    DEFAULT_BRACES: fg(s.bracket),
    DEFAULT_BRACKETS: fg(s.bracket),
    DEFAULT_PARENTHS: fg(s.bracket),
    DEFAULT_COMMA: fg(s.punctuation),
    DEFAULT_SEMICOLON: fg(s.punctuation),
    DEFAULT_DOT: fg(s.punctuation),
    DEFAULT_FUNCTION_DECLARATION: fg(s.function),
    DEFAULT_FUNCTION_CALL: fg(s.function),
    DEFAULT_INSTANCE_METHOD: fg(s.method),
    DEFAULT_STATIC_METHOD: fg(s.method),
    DEFAULT_CLASS_NAME: fg(s.class),
    DEFAULT_CLASS_REFERENCE: fg(s.class),
    DEFAULT_INTERFACE_NAME: fg(s.interface),
    TYPE_PARAMETER_NAME_ATTRIBUTES: fg(s.typeParameter),
    ENUM_CONST: fg(s.enumMember),
    DEFAULT_PARAMETER: fg(s.parameter),
    DEFAULT_LOCAL_VARIABLE: fg(s.variable),
    DEFAULT_REASSIGNED_LOCAL_VARIABLE: fg(s.variable),
    DEFAULT_REASSIGNED_PARAMETER: fg(s.parameter),
    DEFAULT_GLOBAL_VARIABLE: fg(s.variable),
    DEFAULT_IDENTIFIER: fg(s.variable),
    DEFAULT_INSTANCE_FIELD: fg(s.property),
    DEFAULT_STATIC_FIELD: fg(s.property),
    DEFAULT_METADATA: fg(s.decorator),
    DEFAULT_LABEL: fg(s.typeParameter),
    DEFAULT_TAG: fg(s.tag),
    DEFAULT_ATTRIBUTE: fg(s.attribute),
    DEFAULT_ENTITY: fg(s.stringEscape),
    "JS.REGEXP": fg(s.regexp),
    "JSON.PROPERTY_KEY": fg(s.jsonKey),
    YAML_SCALAR_KEY: fg(s.tag),
    HTML_TAG: fg(s.punctuation),
    XML_TAG: fg(s.punctuation),
    XML_TAG_DATA: fg(s.bracket),

    MARKDOWN_HEADER: fg(s.heading),
    MARKDOWN_HEADER_BOLD: fg(s.heading),
    MARKDOWN_CODE_BLOCK: fg(s.raw),
    MARKDOWN_CODE_FENCE: fg(s.raw),
    MARKDOWN_AUTO_LINK: fg(link),
    MARKDOWN_IMAGE: fg(link),
    MARKDOWN_REFERENCE_LINK: fg(link),
    MARKDOWN_BLOCK_QUOTE_MARKER: fg(s.punctuation),
    MARKDOWN_HEADER_LEVEL_1: fg(s.heading),
    MARKDOWN_HEADER_LEVEL_2: fg(s.heading),
    MARKDOWN_HEADER_LEVEL_3: fg(s.heading),
    MARKDOWN_HEADER_LEVEL_4: fg(s.heading),
    MARKDOWN_HEADER_LEVEL_5: fg(s.heading),
    MARKDOWN_HEADER_LEVEL_6: fg(s.heading),
    MARKDOWN_BOLD: fg(s.bold),
    MARKDOWN_ITALIC: fg(s.italic),
    MARKDOWN_CODE_SPAN: fg(s.raw),
    MARKDOWN_LINK_TEXT: fg(link),

    ERRORS_ATTRIBUTES: effect(err, "wave", { ERROR_STRIPE_COLOR: err }),
    WARNING_ATTRIBUTES: effect(warn, "wave", { ERROR_STRIPE_COLOR: warn }),
    WEAK_WARNING_ATTRIBUTES: effect(info, "wave", { ERROR_STRIPE_COLOR: info }),
    WRONG_REFERENCES_ATTRIBUTES: err && { FOREGROUND: err },
    BAD_CHARACTER: effect(err, "wave"),
    DEPRECATED_ATTRIBUTES: effect(c("editor.foreground"), "strikeout"),
    MARKED_FOR_REMOVAL_ATTRIBUTES: effect(err, "strikeout"),
    NOT_USED_ELEMENT_ATTRIBUTES: s.comment && { FOREGROUND: s.comment.color },
    TODO_DEFAULT_ATTRIBUTES: warn && { FOREGROUND: warn, FONT_TYPE: 2, ERROR_STRIPE_COLOR: warn },
    HYPERLINK_ATTRIBUTES: link.color && { FOREGROUND: link.color, ...effect(link.color, "underline") },
    FOLLOWED_HYPERLINK_ATTRIBUTES: link.color && { FOREGROUND: link.color, ...effect(link.color, "underline") },
    UNMATCHED_BRACE_ATTRIBUTES: { FOREGROUND: c("editorBracketHighlight.unexpectedBracket.foreground", "editorError.foreground") },
    MATCHED_BRACE_ATTRIBUTES: bg(se("editorBracketMatch.background"), effect(c("editorBracketMatch.border"), "boxed")),

    SEARCH_RESULT_ATTRIBUTES: bg(se("editor.findMatchHighlightBackground"), { ERROR_STRIPE_COLOR: c("editorOverviewRuler.findMatchForeground", "minimap.findMatchHighlight") }),
    TEXT_SEARCH_RESULT_ATTRIBUTES: bg(se("editor.findMatchBackground"), { ERROR_STRIPE_COLOR: c("editorOverviewRuler.findMatchForeground", "minimap.findMatchHighlight") }),
    WRITE_SEARCH_RESULT_ATTRIBUTES: bg(se("editor.findMatchBackground")),
    IDENTIFIER_UNDER_CARET_ATTRIBUTES: bg(se("editor.wordHighlightBackground"), { ERROR_STRIPE_COLOR: c("editorOverviewRuler.wordHighlightForeground", "editor.wordHighlightStrongBackground") }),
    WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES: bg(se("editor.wordHighlightStrongBackground")),
    FOLDED_TEXT_ATTRIBUTES: { FOREGROUND: c("descriptionForeground"), BACKGROUND: se("editor.foldBackground", "editor.wordHighlightBackground") },
    INLAY_DEFAULT: { FOREGROUND: c("editorInlayHint.foreground", "editorCodeLens.foreground"), BACKGROUND: se("editorInlayHint.background", "editor.lineHighlightBackground") },
    INLINE_PARAMETER_HINT: { FOREGROUND: c("editorInlayHint.foreground", "editorCodeLens.foreground"), BACKGROUND: se("editorInlayHint.background", "editor.lineHighlightBackground") },
    INLINE_PARAMETER_HINT_CURRENT: { FOREGROUND: c("editor.foreground"), BACKGROUND: se("editor.wordHighlightBackground") },
    INLINE_PARAMETER_HINT_HIGHLIGHTED: { FOREGROUND: c("editor.foreground"), BACKGROUND: se("editor.wordHighlightBackground") },
    INLAY_TEXT_WITHOUT_BACKGROUND: { FOREGROUND: c("editorInlayHint.foreground", "editorCodeLens.foreground") },
    BREADCRUMBS_DEFAULT: { FOREGROUND: c("breadcrumb.foreground") },
    BREADCRUMBS_HOVERED: { FOREGROUND: c("breadcrumb.focusForeground") },
    BREADCRUMBS_CURRENT: { FOREGROUND: c("breadcrumb.activeSelectionForeground", "breadcrumb.focusForeground") },
    BREADCRUMBS_INACTIVE: { FOREGROUND: c("disabledForeground") },
    MATCHED_TAG_NAME: bg(se("editorBracketMatch.background")),
    LIVE_TEMPLATE_ATTRIBUTES: effect(c("focusBorder"), "boxed"),

    DIFF_INSERTED: bg(se("diffEditor.insertedLineBackground"), { ERROR_STRIPE_COLOR: c("editorGutter.addedBackground") }),
    DIFF_DELETED: bg(se("diffEditor.removedLineBackground"), { ERROR_STRIPE_COLOR: c("editorGutter.deletedBackground") }),
    DIFF_MODIFIED: bg(tint("editorGutter.modifiedBackground", 0.08), { ERROR_STRIPE_COLOR: c("editorGutter.modifiedBackground") }),
    DIFF_CONFLICT: bg(tint("gitDecoration.conflictingResourceForeground", 0.12), { ERROR_STRIPE_COLOR: c("gitDecoration.conflictingResourceForeground") }),
    BREAKPOINT_ATTRIBUTES: bg(tint("debugIcon.breakpointForeground", 0.15)),
    EXECUTIONPOINT_ATTRIBUTES: bg(tint("debugIcon.breakpointCurrentStackframeForeground", 0.2)),

    CONSOLE_NORMAL_OUTPUT: { FOREGROUND: c("terminal.foreground") },
    CONSOLE_ERROR_OUTPUT: { FOREGROUND: c("terminal.ansiRed") },
    CONSOLE_SYSTEM_OUTPUT: { FOREGROUND: c("descriptionForeground") },
    CONSOLE_USER_INPUT: { FOREGROUND: c("terminal.ansiGreen") },
  };

  const ansi = {
    BLACK: ["ansiBlack", "ansiBrightBlack"],
    RED: ["ansiRed", "ansiBrightRed"],
    GREEN: ["ansiGreen", "ansiBrightGreen"],
    YELLOW: ["ansiYellow", "ansiBrightYellow"],
    BLUE: ["ansiBlue", "ansiBrightBlue"],
    MAGENTA: ["ansiMagenta", "ansiBrightMagenta"],
    CYAN: ["ansiCyan", "ansiBrightCyan"],
  };
  for (const [name, [normal, bright]] of Object.entries(ansi)) {
    attributes[`CONSOLE_${name}_OUTPUT`] = { FOREGROUND: c(`terminal.${normal}`) };
    attributes[`CONSOLE_${name}_BRIGHT_OUTPUT`] = { FOREGROUND: c(`terminal.${bright}`) };
  }
  // IntelliJ names white/bright-black differently from the ANSI spec.
  attributes.CONSOLE_GRAY_OUTPUT = { FOREGROUND: c("terminal.ansiWhite") };
  attributes.CONSOLE_DARKGRAY_OUTPUT = { FOREGROUND: c("terminal.ansiBrightBlack") };
  attributes.CONSOLE_WHITE_OUTPUT = { FOREGROUND: c("terminal.ansiBrightWhite") };
  // The new block terminal uses its own keys.
  for (const name of [...Object.keys(ansi), "WHITE"]) {
    const cap = name[0] + name.slice(1).toLowerCase();
    attributes[`BLOCK_TERMINAL_${name}`] = { FOREGROUND: c(`terminal.ansi${cap}`) };
    attributes[`BLOCK_TERMINAL_${name}_BRIGHT`] = { FOREGROUND: c(`terminal.ansiBright${cap}`) };
  }
  // Logcat (Android Studio).
  attributes.LOG_VERBOSE_OUTPUT = { FOREGROUND: c("descriptionForeground") };
  attributes.LOG_DEBUG_OUTPUT = { FOREGROUND: c("terminal.ansiCyan") };
  attributes.LOG_INFO_OUTPUT = { FOREGROUND: c("terminal.ansiGreen") };
  attributes.LOG_WARNING_OUTPUT = { FOREGROUND: c("terminal.ansiYellow") };
  attributes.LOG_ERROR_OUTPUT = { FOREGROUND: c("terminal.ansiRed") };
  attributes.LOG_EXPIRED_ENTRY = { FOREGROUND: c("disabledForeground") };
  // Semantic highlighting / rainbow palette, from VS Code's bracket pair colors.
  for (let i = 0; i < 5; i++) {
    const color = c(`editorBracketHighlight.foreground${i + 1}`);
    if (color) attributes[`RAINBOW_COLOR${i}`] = { FOREGROUND: color };
  }
  // Custom file types (Settings > Editor > File Types).
  Object.assign(attributes, {
    CUSTOM_KEYWORD1_ATTRIBUTES: fg(s.keyword),
    CUSTOM_KEYWORD2_ATTRIBUTES: fg(s.type),
    CUSTOM_KEYWORD3_ATTRIBUTES: fg(s.function),
    CUSTOM_KEYWORD4_ATTRIBUTES: fg(s.constant),
    CUSTOM_LINE_COMMENT_ATTRIBUTES: fg(s.comment),
    CUSTOM_MULTI_LINE_COMMENT_ATTRIBUTES: fg(s.comment),
    CUSTOM_NUMBER_ATTRIBUTES: fg(s.number),
    CUSTOM_STRING_ATTRIBUTES: fg(s.string),
    CUSTOM_VALID_STRING_ESCAPE_ATTRIBUTES: fg(s.stringEscape),
    CUSTOM_INVALID_STRING_ESCAPE_ATTRIBUTES: fg(s.invalid),
  });

  const lines = [
    `<scheme name="${t.label}" version="142" parent_scheme="${t.dark ? "Darcula" : "Default"}">`,
    "  <colors>",
  ];
  for (const [name, value] of Object.entries(colors)) {
    if (value === undefined) continue;
    lines.push(`    <option name="${name}" value="${hex(value)}" />`);
  }
  lines.push("  </colors>", "  <attributes>");
  for (const [name, value] of Object.entries(attributes)) {
    if (!value) continue;
    const opts = Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (!opts.length) continue;
    lines.push(`    <option name="${name}">`, "      <value>");
    for (const [k, v] of opts) {
      if (k === "FONT_TYPE" && v === 0) continue;
      const out = typeof v === "number" ? String(v) : hex(v);
      lines.push(`        <option name="${k}" value="${out}" />`);
    }
    lines.push("      </value>", "    </option>");
  }
  for (const [name, base] of Object.entries(INHERIT)) {
    if (name in attributes) continue;
    lines.push(`    <option name="${name}" baseAttributes="${base}" />`);
  }
  lines.push("  </attributes>", "</scheme>");
  return lines.join("\n");
}

// ---------- write ----------

const themes = loadThemes();

for (const t of themes) {
  const theme = {
    name: t.label,
    dark: t.dark,
    author: AUTHOR,
    editorScheme: `/themes/${t.id}.xml`,
    ui: prune(uiTheme(t)),
    icons: iconPalette(t),
  };
  writeFile(`${RES}/themes/${t.id}.theme.json`, JSON.stringify(theme, null, 2));
  writeFile(`${RES}/themes/${t.id}.xml`, scheme(t));
}

// Keep the themeProvider list in plugin.xml in sync with package.json.
const pluginXml = path.join(ROOT, RES, "META-INF/plugin.xml");
const providers = themes
  .map((t) => `    <themeProvider id="com.miyamar.theme.${t.id}" path="/themes/${t.id}.theme.json" />`)
  .join("\n");
const xml = fs.readFileSync(pluginXml, "utf8").replace(
  /<!-- generated:themes -->[\s\S]*?<!-- \/generated:themes -->/,
  `<!-- generated:themes -->\n${providers}\n    <!-- /generated:themes -->`,
);
writeFile(`${RES}/META-INF/plugin.xml`, xml);
