# Jig App — UI kit

A high-fidelity recreation of the **jig** desktop app's authenticated workspace,
built entirely from this design system's own components. It demonstrates the two
default jig layouts:

- **Full-width app shell** (`AppScreen.jsx`) — the standard authenticated view.
  A CSS Grid with a sticky, blurred header; a collapsible multi-tier sidebar
  (`Overview`, `Features → users/billing/audit`, `Transport`, `Settings → Codegen`);
  a scrollable content area (the `users` worked slice — stat cards + a data table);
  and a status footer showing the active transport wire.
- **Centered content** (`AuthScreen.jsx`) — the full-page centered layout used for
  auth and focused tasks. A single `Card` with `Field`/`Input`/`Button`.

## Run it

Open `index.html`. It boots into the workspace; the sidebar footer row and the
header toggle are live — click the panel-left button to collapse the sidebar to
its icon rail, and click the account row to sign out to the centered auth screen.

## Files

- `index.html` — mounts the app; `@dsCard` thumbnail + `@startingPoint` screen.
- `AppScreen.jsx` — the full-width shell + users slice.
- `AuthScreen.jsx` — the centered sign-in screen.
- `Icons.jsx` — Lucide icon paths as tiny React components (matches lucide-angular in jig).

## Notes

These are cosmetic recreations. The user table, stats, and transport indicator are
static sample data — the real jig app drives them through the ViewModel → Repository
→ Transport seam described in the source repo's README.
