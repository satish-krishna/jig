# no-hand-set-change-detection

> Engine: `tools/lint/rules/no-hand-set-change-detection.ts`.

## What it forbids

Setting `changeDetection` in a `@Component` metadata object at all. The check is on the property's presence, not its value, the same as `no-explicit-standalone`: any explicit `changeDetection: ...` trips it, because the fact worth flagging is that the author wrote the property, not which strategy they wrote.

## Why

This is not a style preference — it is a fact about this repo's own installed compiler. Verified directly in `node_modules/@angular/compiler/fesm2022/compiler.mjs` (Angular version at the time of writing: 22.0.5):

    changeDetection: decl.changeDetection ?? ChangeDetectionStrategy.OnPush

When a component declares no `changeDetection`, the compiler falls back to `ChangeDetectionStrategy.OnPush`. That is exactly what every migrated component in this codebase was setting explicitly. Removing `changeDetection: ChangeDetectionStrategy.OnPush` from a component's metadata changes nothing about how that component runs — the compiled output is identical either way. A future reader seeing this rule fire, and seeing OnPush components with no `changeDetection` property, should not assume the app regressed to Angular's older `Default` strategy: the default strategy for a component with no `changeDetection` and no `NgModule` (standalone components have none) is OnPush, full stop.

The same waste applies as `no-explicit-standalone`: a property that cannot change the compiled output is not configuration, it is a line every author has to type, read, and eventually copy-paste into the next new component out of habit.

## Accepted form

    @Component({ selector: 'app-x', template: `...` })

## Known blind spots

Shared with `no-explicit-standalone`, since both rules ask the same AST question of the same metadata object:

- A computed key: `@Component({ ['changeDetection']: ChangeDetectionStrategy.OnPush })`.
- A property introduced through a spread: `@Component({ ...base, changeDetection: ChangeDetectionStrategy.OnPush })`.
- Metadata built by a factory function and passed by reference, rather than written as an object literal inline.

None of these forms exist in this codebase today.
