# no-space-utility

> Engine: `tools/lint/rules/no-space-utility.ts`.

## What it forbids

Tailwind's `space-x-*` and `space-y-*` utilities, in either their bare form (`space-y-4`) or behind a responsive or state prefix (`sm:space-x-2`), checked against `baseUtility(cls)` from `tools/lint/ast.ts` so the prefix cannot hide the match.

## Why

`space-x-*`/`space-y-*` work by injecting a margin into every child but the first, via a sibling selector. The gap they produce lives on the children, not on the container, so reading the container's own class list tells you nothing about how its children are spaced — the layout fact is scattered across elements instead of stated once where the container is defined. `gap-*` on a `flex` or `grid` container states the same gap as one property, on one element, and does not depend on sibling order, so removing or reordering a child never silently changes the spacing. Every consumer of this template that reads container classes to understand layout (`no-nested-flex-grid` included) can only reason about the container's own class list; a `space-*` utility puts the fact it needs somewhere else.

## Accepted form

    <div class="grid gap-m">
    <div class="flex gap-s">

## Rejected form

    <div class="space-y-4">
    <div class="sm:space-x-2">

## Measured count: zero, and that is the point

This rule finds **zero** violations in the current codebase — there is not one `space-x-*` or `space-y-*` utility, bare or prefixed, in any app template or showcase page. That is expected, not a sign of a broken or pointless rule: this repo is a template every clone inherits, and the rule's job is prevention, not correction — the same role `no-raw-icon` and `no-ng-class-style` play elsewhere in this enforcement plan. The team already puts gap on the container by convention; the rule's job is to keep it that way once templates are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-space-utility.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads static `class` attribute text only. A `space-*` utility assembled at runtime and bound through `[class]` never appears as a literal class token in a template and is invisible to a template-only rule. It also has no opinion on whether a `gap-*` value used instead is the right one — only on whether the spacing mechanism is margin-on-children or gap-on-container.
