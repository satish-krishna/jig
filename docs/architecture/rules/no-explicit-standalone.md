# no-explicit-standalone

> Engine: `tools/lint/rules/no-explicit-standalone.ts`.

## What it forbids

Setting `standalone` in a `@Component` metadata object at all. The check is on the property's presence, not its value: `standalone: false` trips the rule exactly as `standalone: true` does, because the decidable fact is that the property was written, not what it was written to.

## Why

Angular has made every component standalone by default since v19 (no `NgModule` declaration is possible any more), so writing `standalone: true` restates a fact the compiler already enforces. Writing `standalone: false` is worse: it reads as a deliberate opt-out of a mode that no longer exists to opt out of, which invites a future reader to go looking for the module that declares the component — a module that was never there.

A property that cannot change the compiled output is not configuration. It is noise every author now has to read past, and noise that a future migration (or a search for real uses of `standalone`) has to wade through.

## Accepted form

    @Component({ selector: 'app-x', template: `...` })

## Known blind spots

The check is a literal property-key match against the `@Component({...})` object literal. It does not see:

- A computed key: `@Component({ ['standalone']: true })`.
- A property introduced through a spread: `@Component({ ...base, standalone: true })`.
- Metadata built by a factory function and passed by reference, rather than written as an object literal inline.

None of these forms exist in this codebase today, but a future author could use any of them to route around the rule.
