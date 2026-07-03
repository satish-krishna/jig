# Design language and UI (spartan + the jig-design skill)

Read this before you build UI, style a component, or make a mock. The **design language** is one thing with two homes, and confusing them is a DRY violation.

## The rule: two homes, one language

| You are building | Source of truth |
|---|---|
| **Production UI** (a real Angular view or control) | spartan helm components + the tokens in `frontend/src/styles.css` |
| **A mock, preview, slide, or throwaway prototype** | the `jig-design` skill (portable CSS/React, no Angular build) |

Both render the same visual language. They are not two design systems — the `jig-design` skill is a **faithful reproduction of the real frontend**, translated from Tailwind/spartan into standalone CSS so previews render pixel-accurate without a build. The app is upstream; the skill mirrors it. When the two disagree, `frontend/src/styles.css` and `frontend/libs/ui/*` win. See ADR 0007.

## Production UI

- **Controls are spartan helm.** Compose from `frontend/libs/ui/*` behind the `@spartan-ng/helm/*` alias; add one with `ng g @spartan-ng/cli:ui <name>`. Never hand-roll a styled control that spartan already provides. The `spartan` skill and MCP carry the component APIs.
- **Never hardcode a token.** Colors, radius, spacing, and shadow come from the CSS custom properties in `styles.css` (`--primary`, `--muted-foreground`, `--border`, `--radius`, `--sidebar`, …). A literal hex or px in a component is the smell.
- **Do not copy the skill's CSS into production.** The skill's `css/*` is a mirror for offline rendering; forking it into the app creates a second source of truth for the theme. Change the theme in `styles.css`; the skill is downstream.

## Mocks, previews, and prototypes

- **Invoke the `jig-design` skill.** It ships the tokens, component classes, the React primitives, and the app-shell / centered layouts, plus foundation specimen cards. Link its `styles.css` (one import) and build static HTML or React — no Angular, no Tailwind build required.
- **Prototype output stays out of production paths.** A mock is a throwaway artifact for the user to view, not code that ships. Promote it by rebuilding in spartan + `styles.css`, not by wiring the skill's bundle into the app.

## The non-negotiable feel

These traits define jig and are not yours to loosen. Their canonical statement (with rationale, specimens, and dark mode) lives in the `jig-design` skill's readme and `foundations/`; the short version:

- **Palette:** pure neutral OKLCH grayscale, zero chroma. `--destructive` (red) is the *only* chromatic token. This is a canvas, not a billboard.
- **Density:** 4px base, compact 32px (`h-8`) controls, `px-2.5`. Do not roomy-fy it.
- **Radius:** 0 — flat squared corners (the Spartan **Lyra** look). Only avatars round.
- **Borders over shadow:** 1px hairlines everywhere; `shadow-sm` at most. No glow, no colored borders, no accent stripes.
- **Backgrounds:** flat solid fills. No gradients, no imagery, no texture.
- **Motion:** quick and functional (120–150ms); a 1px press nudge; no bounces or loops.
- **Type:** native system sans (Segoe UI), system mono (Consolas) for developer content. Body 14px. No webfonts.
- **Copy:** terse and technical. Sentence case; identifiers stay lowercase (`users`, `jig`, `main`). No emoji (the passing-gate `✓` is the one sanctioned glyph).

## Smells that mean the pattern is breaking

- A literal hex or px in a component instead of a `styles.css` token.
- A hand-rolled control that duplicates a spartan helm component.
- Editing the `jig-design` skill's `css/*` to change how the *app* looks (edit `styles.css` — the skill is downstream).
- A prototype's React bundle wired into a production path.
- Rounded corners, gradients, a second accent color, or a roomier control scale — the feel above is a gate, not a default.
