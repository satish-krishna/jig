# no-legacy-icon-module

> Engine: `tools/lint/rules/no-legacy-icon-module.ts`.

## What it forbids

Any `@Component` whose `imports` array lists `NgIconsModule`. The check reuses `componentImports` from `tools/lint/ast.ts` — the same decorator-metadata walk `no-forms-module` and `no-explicit-standalone` already use — rather than re-walking the `imports` array literal a second time.

## Why

`@ng-icons/core` ships two ways to wire icons into a standalone Angular app: the legacy `NgIconsModule.withIcons({...})` NgModule API, and the standalone `provideIcons({...})` function plus `<ng-icon name="...">`. This app has standardized on the second — see `frontend/src/app/app.config.ts`, which calls `provideIcons` once at application scope. `NgIconsModule` is the pre-standalone shape: importing it into a component's `imports` array reintroduces an NgModule into a codebase that otherwise has none, and it is easy to reach for by habit if a contributor has used `@ng-icons/core` before this app's convention existed. Two registration mechanisms for the same icon set is drift the moment one component picks the wrong one.

## Accepted form

    // frontend/src/app/app.config.ts
    providers: [provideIcons({ lucideUsers })]

## Rejected form

    @Component({
      selector: 'app-x',
      imports: [NgIconsModule],
    })
    export class X {}

## Measured count: zero, and that is the point

`NgIconsModule` appears nowhere in the app today — every one of the app's icon-consuming files already uses `provideIcons` plus `<ng-icon>`. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the same role `no-raw-icon` plays for pasted SVG and `no-unregistered-icon` plays for glyphs imported but never registered. The team already does the right thing here by convention; the rule's job is to keep it that way once components are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-legacy-icon-module.test.ts` `RuleTester` case is what proves the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads the decorator metadata's `imports` array literal only, via `componentImports`. `NgIconsModule` reached through a spread, a computed reference, or re-exported under a local alias is invisible to it. It also has no opinion on whether a component actually needs icons at all — it only stops the legacy registration path once a component reaches for icons.
