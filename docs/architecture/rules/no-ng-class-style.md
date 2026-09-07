# no-ng-class-style

> Engine: `tools/lint/rules/no-ng-class-style.ts`.

## What it forbids

`ngClass` and `ngStyle` in either form they can take on an element: a bound input — `[ngClass]="expr"`, `[ngStyle]="expr"` — which the parser puts in the element's `inputs` list, or a bare attribute — `ngClass`, `ngStyle` — which the parser puts in its `attributes` list. The rule checks both collections, because either form applies the same directive and either form is equally invisible to static analysis once it lands.

## Why

`[class.foo]="expr"` and `[style.width]="expr"` are Angular's own class and style bindings: each names one specific class or CSS property statically, so a rule (or a reader) can see exactly what it does by reading the template. `ngClass` and `ngStyle` instead take an arbitrary object, array, or string built at runtime — `[ngClass]="{ 'is-open': open(), 'is-busy': busy() }"` — and every class or style property it can produce is decided in TypeScript, not in the template. `no-style-attribute` already forbids the static `style="..."` attribute for the same underlying reason; `ngClass`/`ngStyle` are the dynamic escape hatch that a static-attribute ban alone does not close, because they hide the class list from every check that reads a template's class attributes, including `no-literal-spacing`, `no-appearance-on-primitive`, and this rule's own sibling gates.

## Accepted form

    <div [class.is-open]="open()">
    <div [style.width]="dynamicWidth()">
    <div class="grid gap-m">

## Rejected form

    <div [ngClass]="{ 'is-open': open() }">
    <div [ngStyle]="{ width: dynamicWidth() }">
    <div ngClass>

## Measured count: zero, and that is the point

This rule finds **zero** violations in the current codebase — there is not one `ngClass` or `ngStyle`, bound or bare, in any app template or showcase page. That is expected, not a sign of a broken or pointless rule: this repo is a template every clone inherits, and the rule's job is prevention, not correction — the same role `no-raw-icon` and `no-legacy-control-flow` play elsewhere in this enforcement plan. The team already does the right thing here by convention; the rule's job is to keep it that way once templates are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-ng-class-style.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads an element's own `attributes` and `inputs` lists only, so it catches `ngClass`/`ngStyle` wherever the template parser attaches them to an element. It has no opinion on a class list assembled dynamically some other way — a component method that mutates `classList` directly, or a `[attr.class]` binding — those never appear as an `ngClass`/`ngStyle` attribute or input and are invisible to this rule.
