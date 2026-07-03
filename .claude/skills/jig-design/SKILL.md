---
name: jig-design
description: Use this skill to generate well-branded interfaces and assets for jig, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **jig** is a developer-focused, AI-native desktop app template (Angular SPA over Tauri IPC + a .NET API). The UI is built on **Spartan-ng / shadcn** with a **neutral OKLCH grayscale** palette — the only chromatic token is `--destructive` (red).
- **Link one file:** `styles.css` pulls in every token and component class. Then use the CSS custom properties (`--primary`, `--muted-foreground`, `--radius`, `--sidebar`, …) — never hardcode hex.
- **React components** live under `components/*` and bundle to `window.JigDesignSystem_ac97f9` (verify the namespace with the compiler if unsure). Load `_ds_bundle.js` after React to use them.
- **Feel:** compact 32px controls, 1px hairline borders over shadow, flat solid fills (no gradients/imagery), quick 120ms transitions, a 1px press nudge. Copy is terse, lowercase for identifiers (`users`, `jig`), sentence case elsewhere, no emoji.
- **Icons:** Lucide, outline, stroke 2 — reuse `ui_kits/jig-app/Icons.jsx`.
- **Layouts:** the full-width app shell (`AppShell` + `Sidebar` + multi-tier `NavItem`) and the centered content layout (`.hlm-centered`). See `ui_kits/jig-app/`.
