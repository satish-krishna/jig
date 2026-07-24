# Jig Design System

A design system for **jig** — an AI-native desktop application template. Jig is
one Angular SPA that runs two ways: as a **thick client** inside a Tauri shell
(Rust core, IPC) and as a **thin client** against a remote **.NET FastEndpoints**
API (HTTP). One frontend, two wires. The UI is developer-focused, dense, and
neutral — crisp hairline borders over heavy shadow, a compact 32px control scale,
and a restrained monochrome palette so the developer's content is the only color
on screen.

This system is a faithful reproduction of jig's actual frontend, which is built on
**Spartan-ng** (`@spartan-ng/helm` + `/brain`) — the Angular port of **shadcn/ui**.
It captures the exact tokens and component classes shipped in the repo, translated
from Tailwind utility strings into portable CSS so any consumer (React previews,
static HTML, slides) renders pixel-accurate jig UI without an Angular/Tailwind build.

## Sources

Everything here was derived from the attached repository — explore it to build
richer, more accurate jig designs:

- **GitHub:** `satish-krishna/jig` — https://github.com/satish-krishna/jig (private)
  - `frontend/src/styles.css` — the theme tokens (OKLCH neutral scale, light + dark).
  - `frontend/libs/ui/*` — the Spartan `hlm*` directives (button, input, label, field, separator). Numeric values (heights, paddings, radii) were copied verbatim from these files.
- **Spartan / shadcn reference:** the Spartan Figma docs — https://spartan.ng/documentation/figma — informed the card, badge, and sidebar treatments that jig's token set (`--card`, `--sidebar-*`) implies but the copied subset didn't yet instantiate. See "Intentional additions" below.

> Access note: the repo is private. If you can open it, prefer reading the real
> `hlm-*.ts` directives over inferring from this README — they are the ground truth.

---

## Content fundamentals

How jig writes. Copy is **terse, technical, and confident** — written for engineers,
never marketing.

- **Voice & person.** Instructional and impersonal. The docs address the reader as
  "you" in imperatives ("Discover first", "Copy its shape; do not add speculative
  features") and describe the system in plain third person ("One frontend, two wires").
  No "we", no first-person plural cheerleading.
- **Casing.** Sentence case everywhere — headings, buttons, labels. Product and
  code identifiers stay **lowercase** even as headings and page titles (`users`,
  `jig`, `main`). Never Title Case a slice or command.
- **Tone.** Declarative and a little wry, grounded in the maker metaphor ("A jig is
  the fixture a maker builds once…"). States facts and constraints; avoids adjectives
  and exclamation. Prefers the rule over the reassurance.
- **Density.** Short sentences. Nouns from the domain: *slice*, *seam*, *wire*, *gate*,
  *fixture*, *catalog*, *transport*. Numbers and versions are shown as monospace facts
  (`v0.4.0`, `Ctrl K`, `main`), not prose.
- **Emoji.** None in product UI. The repo uses a single `✓`/`green` convention for the
  passing gate; treat that as the only sanctioned glyph.
- **Examples.** Titles: "Sign in to your workspace", "users". Descriptions:
  "The one worked vertical slice, end to end.", "Lowercase, hyphenated. Used for the
  npm name." Buttons: "New user", "Sign in", "Continue with GitHub".

---

## Visual foundations

- **Palette.** Pure neutral, authored in **OKLCH** with zero chroma on every surface
  token (`oklch(L 0 0)`) — a true grayscale from white `1 0 0` to near-black
  `0.145 0 0`. The **only** chromatic token is `--destructive` (a red,
  `0.577 0.245 27`). Primary is near-black, not a brand hue: this is a canvas, not a
  billboard. A full `.dark` scope inverts the same aliases.
- **Type.** Native **Windows system sans** (Segoe UI, with Roboto/Arial fallbacks) — no
  webfonts are shipped. A **system monospace** stack (Consolas) carries developer content: emails, IDs,
  versions, keyboard hints. Body is **14px (`text-sm`)**; headings 24px, semibold (600),
  tight tracking (`-0.015em`). Labels and buttons are medium (500).
- **Spacing & density.** 4px base unit. Controls are **compact**: default height is
  **32px (`h-8`)**, horizontal padding **10px (`px-2.5`)**, control gap 6px. Card gutters
  are 24px. This tightness is a defining jig trait — do not loosen to a roomier scale.
- **Radius (nova style).** The `--radius` knob is **0.625rem (10px)**, and every other
  radius derives from it: controls 10px, cards 14px, menu rows 8px. Only genuinely
  circular elements (avatars) keep `--radius-full`. This mirrors `frontend/src/styles.css`
  — the app is upstream (ADR 0007), so if `--radius` moves there it moves here. To go flat,
  set `--radius: 0` in the app; corners are token-driven, so nothing needs regenerating.
- **Borders over shadow.** The UI is built on **1px hairlines** (`--border`, a light
  gray) — inputs, cards, table rows, the sidebar edge, the header underline. Shadow is
  deliberately restrained: `shadow-sm` on cards, larger ramps reserved for popovers and
  modals. No glow, no colored borders, no left-accent stripes.
- **Backgrounds.** Flat solid fills only. No gradients, no imagery, no texture or
  pattern. The one transparency effect is the **sticky header**: a
  `backdrop-filter: blur(8px)` over an 80%-opacity background so content scrolls under it.
- **Motion.** Quick and functional: 120–150ms color/background transitions on hover,
  a 200ms sidebar collapse. The only "playful" motion is a **1px downward nudge** on
  button press (`active: translateY(1px)`) and a chevron rotate on menu expand. No
  bounces, no long eases, no decorative loops.
- **Hover / press states.** Hover = a subtle fill change (solid buttons drop to 80%
  opacity of their fill; ghost/outline pick up `--muted`; nav rows pick up
  `--sidebar-accent`). Press = the 1px nudge. Focus = a 3px `--ring` halo plus a
  border color shift (never a bare outline). Invalid = `--destructive` border + a
  destructive-tinted ring.
- **Corners & cards.** Cards are `--card` fill, a 1px `--border`, `radius-xl` (14px),
  and a single `shadow-sm`. Flat and quiet — one elevation level, never nested shadows.

---

## Iconography

- **System.** jig uses **Lucide** (via `lucide-angular` in the app; Lucide is the
  default icon set for shadcn/Spartan). Icons are **outline SVGs**, stroke width **2**,
  round caps and joins, sized to the current font (`1em`, ~16px in controls). They are
  monochromatic — `currentColor` — never filled or multi-color.
- **In this system.** Because components bundle to React with only React available,
  icons are passed as a `ReactNode` prop/child rather than baked in. `ui_kits/jig-app/
  Icons.jsx` provides the exact Lucide paths as tiny React components (home, box, users,
  cog, search, bell, panel-left, git-branch, terminal, credit-card, file-text, check,
  plus, more-horizontal, arrow-right). Reuse these; do not hand-draw new glyphs. For new
  icons, copy the path from https://lucide.dev at stroke 2.
- **Emoji / unicode.** No emoji in product UI. A single `✓` marks the passing gate.
  Keyboard hints (`Ctrl K`) render in the `.hlm-kbd` chip using the mono stack.
- **Logo.** The source repo ships **no logo file**. The brand is therefore set in plain
  type ("jig", lowercase) with a **monospace "J" monogram** in a primary-filled rounded
  square standing in for a mark. This is a placeholder, not an official logo — see caveats.

---

## Components

Reusable React primitives (namespace `window.JigDesignSystem_ac97f9`). The families
below are exactly those the source defines (`frontend/libs/ui/*`), plus a small set of
intentional additions the token file implies.

**From the jig source:**

- **Button** — `hlmBtn`. Variants: default, outline, secondary, ghost, destructive, link. Sizes: default/xs/sm/lg + square icon/icon-xs/icon-sm/icon-lg.
- **Input** — `hlmInput`. 32px, transparent, focus ring, invalid state.
- **Textarea** — the Input skin, multi-line (implied companion of Input).
- **Label** — `hlmLabel`.
- **Field** (+ **FieldDescription**, **FieldError**) — `hlmField`. Vertical/horizontal groups with 8px rhythm.
- **Separator** — `hlmSeparator`. 1px, horizontal/vertical.

**Intentional additions** (the jig theme declares `--card`, `--popover`, and the full
`--sidebar-*` family, and the brief requires the layout shells, so these are instantiated
to match Spartan/shadcn defaults):

- **Card** (+ **CardHeader**, **CardTitle**, **CardDescription**, **CardContent**, **CardFooter**) — shadcn card surface.
- **Badge** — shadcn badge; default/secondary/destructive/outline.
- **Sidebar** layout family: **AppShell**, **ShellHeader**, **ShellMain**, **ShellFooter**, **Sidebar**, **SidebarHeader**, **SidebarBody**, **SidebarFooter**, **NavGroup**, **NavItem** — the full-width shell and the collapsible multi-tier menu the brief asks for, driven by the `--sidebar-*` tokens.

Each component directory carries a `.jsx`, a `.d.ts` (props contract), a `.prompt.md`
(usage), and a shared `@dsCard` HTML thumbnail.

## UI kits

- **`ui_kits/jig-app/`** — the jig authenticated workspace. Demonstrates both default
  layouts: the full-width app shell (sticky header + collapsible multi-tier sidebar +
  content + footer, on CSS Grid) and the centered auth screen. Interactive: collapse the
  sidebar, sign out to the centered layout. See its README.

## Foundations

Specimen cards live in `foundations/` (Colors, Type, Spacing, Brand groups) and render
in the Design System tab: surfaces, actions, lines/focus, sidebar family, dark mode,
type families/scale/weights, radius, elevation, spacing, and the wordmark.

---

## Index / manifest

- `styles.css` — **the only file consumers link.** A manifest of `@import`s; no rules.
- `tokens/` — `colors.css`, `typography.css`, `radius.css`, `shadows.css`, `spacing.css`.
- `css/` — `base.css` (reset/defaults), `components.css` (concrete component classes), `layout.css` (app shell + sidebar).
- `components/core/` — Button, Badge, Card, Separator (+ card, prompts, types).
- `components/forms/` — Input, Textarea, Label, Field.
- `components/navigation/` — Sidebar / app-shell family.
- `foundations/` — specimen cards.
- `ui_kits/jig-app/` — the workspace recreation.
- `SKILL.md` — Agent-Skills manifest for downloading this system into Claude Code.

## Caveats

- **No official logo.** The source ships none; the "jig" wordmark + "J" monogram here are
  a type-only placeholder. Replace with the real mark if one exists.
- **No webfonts.** jig uses the native system stacks; this system ships none. If jig
  standardizes on a specific family later, add `@font-face` and update `tokens/typography.css`.
- **Additions flagged, not invented wholesale.** Card, Badge, and the Sidebar family go
  beyond the five directives in `frontend/libs/ui/` — they are grounded in jig's own token
  set and the brief's layout requirements, and follow Spartan/shadcn defaults. If jig's real
  implementations differ, prefer those.
