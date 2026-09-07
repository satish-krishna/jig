# no-unregistered-icon

> Engine: `tools/lint/rules/no-unregistered-icon.ts`.

## What it forbids

A file that imports one or more named glyphs from `@ng-icons/lucide` and never calls `provideIcons(` anywhere in that same file. The rule reports **once per file, at the first offending import** — a file importing eight glyphs with no `provideIcons` call is one defect, not eight, because the fix is the same single `provideIcons({...})` call regardless of how many glyphs are missing from it.

The check is file-scoped, not component-scoped: `provideIcons(...)` may appear in a component's `providers`, in an `ApplicationConfig` (`frontend/src/app/app.config.ts` is exactly this case — it imports six glyphs and calls `provideIcons` at application level), or in a test's `TestBed` setup. If the call exists anywhere in the file, every glyph import in that file counts as registered.

Only named glyph imports count. A type-only import (`import type { X } from '@ng-icons/lucide'`) and a bare side-effect import (`import '@ng-icons/lucide'`) are not glyphs and never trigger the rule.

## Why

`<ng-icon name="lucideUsers" />` resolves `"lucideUsers"` against the icon map assembled by every `provideIcons({...})` call visible to Angular's injector. Importing the `lucideUsers` binding from `@ng-icons/lucide` does nothing on its own — the import only makes the glyph object available to pass into `provideIcons`. A file that imports a glyph and never registers it compiles cleanly, produces no runtime error, and renders an empty `<ng-icon>` — the failure is silent and only shows up as a visually missing icon, which is easy to miss in review and does not fail a build. Catching the gap at import time turns a silent rendering bug into a lint error at the point the mistake is made.

## Accepted form

    // frontend/src/app/app.config.ts
    import { lucideUsers } from '@ng-icons/lucide';
    import { provideIcons } from '@ng-icons/core';

    providers: [provideIcons({ lucideUsers })]

## Rejected form

    import { lucideUsers } from '@ng-icons/lucide';
    // ... lucideUsers is never passed to provideIcons anywhere in this file.

## Measured count: zero, and that is the point

All 30 files in the app that import a named glyph from `@ng-icons/lucide` already call `provideIcons` somewhere in that same file. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the same role `no-raw-icon` plays for pasted SVG. The team already registers every glyph it imports by convention; the rule's job is to keep it that way once icons are imported faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-unregistered-icon.test.ts` `RuleTester` cases (including the "eight glyphs, one report" case) are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It only checks that `provideIcons(` is called somewhere in the file, not that the specific imported glyph is one of the arguments passed to it. A file that imports `lucideUsers` and calls `provideIcons({ lucidePlus })` — registering the wrong glyph — passes this rule; it only catches the "imported and registered nowhere" case, not a mismatch between what is imported and what is registered. It also cannot see registration that happens in a different file (a shared icon-registration module imported by the component) — the call has to be textually present in the same file as the import.
