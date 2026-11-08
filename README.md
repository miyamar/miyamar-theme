<div align="left">
  
# Miyamar Theme

A modern VS Code theme with polished dark and light variants.

</div>

## Features

- Clean, readable editor colors
- Balanced dark and light themes
- Focused syntax highlighting
- Minimal UI distractions

## Dark Theme

<div align="center">
<img width="100%" style="height: auto;" alt="Dark Theme Screenshot" src="https://github.com/user-attachments/assets/0416ccdb-572b-44c0-a790-b490729454c9" />
</div>

## Milky Pink - On Baby Girl Special Wish 🥰🫶🏼

<div align="center">
  <img width="100%" style="height: auto;" alt="Milky Pink Theme Screenshot" src="https://github.com/user-attachments/assets/85023816-1ff1-47cf-89e7-cb8f1f729197" />
</div>

## Light Theme

<div align="center">
<img width="100%" style="height: auto;" alt="Light Theme Screenshot" src="https://github.com/user-attachments/assets/e6ce37f0-342b-4e3b-adc5-c1544722c401" />
</div>

## Burgundy Light Theme

<div align="center">
  <img width="100%" style="height: auto;" alt="Burgundy Light Theme Screenshot" src="https://github.com/user-attachments/assets/acf7c5a6-5413-4ec3-a687-e7ffae20d00a" />
</div>

## Burgundy Dark Theme

<div align="center">
  <img width="100%" style="height: auto;" alt="Burgundy Dark Theme Screenshot" src="https://github.com/user-attachments/assets/0857aa3f-df57-463c-a6ce-2186f818701c" />
</div>

## Installation

### VS Code

1. Open VS Code or any supported editor
2. Go to Extensions, Search and Install

### Zed (coming soon)

1. Open the Extensions view (`zed: extensions`)
2. Search for "Miyamar Theme" and install

### JetBrains IDEs (coming soon)

1. Open Settings → Plugins → Marketplace
2. Search for "Miyamar Theme" and install

## Usage

- **VS Code:** Command Palette → "Preferences: Color Theme" → select a Miyamar theme
- **Zed:** Command Palette → `theme selector: toggle` → select a Miyamar theme
- **JetBrains:** Settings → Appearance & Behavior → Appearance → Theme → select a Miyamar theme
  (the matching editor color scheme is applied with it)

## Development

The VS Code themes in `themes/` are the source of truth. The Zed and JetBrains
themes are generated from them:

```bash
npm run build
```

This rewrites `zed/themes/miyamar.json` and the files under
`jetbrains/src/main/resources/themes/`. Commit the generated files together with
the theme change; CI fails if they are out of date.

Releases are tag-driven, and each tag must match that port's version:

| Tag | Version lives in | Publishes to |
| --- | --- | --- |
| `vscode-v1.2.3` | `package.json` | VS Code Marketplace, Open VSX |
| `zed-v1.2.3` | `zed/extension.toml` | PR on `zed-industries/extensions` |
| `jetbrains-v1.2.3` | `jetbrains/gradle.properties` | JetBrains Marketplace |

----------------------------------------------
## License

MIT
