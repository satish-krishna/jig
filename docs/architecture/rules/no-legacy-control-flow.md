# no-legacy-control-flow

> Engine: `tools/lint/rules/no-legacy-control-flow.ts`.

## What it forbids

The legacy structural directives — `*ngIf`, `*ngFor`, `*ngSwitch`, `*ngSwitchCase`, `*ngSwitchDefault` — anywhere in an app template. A structural directive desugars during parsing to a `Template` node carrying the directive's name in that node's `templateAttrs` list; the rule reads that list rather than pattern-matching the raw `*ngIf="..."` microsyntax string, because the microsyntax has more written forms than a regular expression can enumerate (`*ngFor="let i of xs; trackBy: fn"`, `*ngIf="x; else y"`, and so on) and a text match would miss the ones nobody thought of first.

## Why

Angular's built-in control flow (`@if`, `@for`, `@switch`) replaced the structural directives: it compiles to less code, needs no `CommonModule` import, and reads as a block rather than an attribute whose value is a small embedded language. Once a codebase adopts `@if`/`@for` as the standard, every remaining `*ngIf` is a second control-flow dialect a reader has to keep in their head, and the two dialects do not compose — a `*ngFor` cannot carry an `@if`'s `; else` block, and mixing them in one template is exactly the kind of inconsistency a template gate exists to catch before review has to.

## Accepted form

    @if (user) { <p>Welcome</p> }
    @for (item of items; track item.id) { <li>{{ item.name }}</li> }

## Rejected form

    <p *ngIf="user">Welcome</p>
    <li *ngFor="let item of items">{{ item.name }}</li>

## Measured count: zero, and that is the point

This rule finds **zero** violations in the current codebase — there are 46 `@if` blocks across the app and showcase, and not one `*ngIf`, `*ngFor`, or `*ngSwitch`. That is expected, not a sign of a broken or pointless rule: this repo is a template every clone inherits, and the rule's job is prevention, not correction — it exists so the first `*ngIf` pasted from an older tutorial or an older project never lands, rather than existing to clean up ones that already have. The same role `no-raw-icon` plays for pasted `<svg>` blobs. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-legacy-control-flow.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads the parsed template AST's `Template` nodes only, so it catches every desugared structural-directive form the parser produces. It has no opinion on `NgIf`/`NgFor`/`NgSwitch` used as directives imported and applied some other way outside a template's own structural-directive syntax, and no opinion on whether a `@if`/`@for` block is itself well-formed — this rule only forbids the older dialect, it does not review the newer one.
