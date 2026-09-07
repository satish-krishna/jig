# no-nested-flex-grid

> Engine: `tools/lint/rules/no-nested-flex-grid.ts`.

## What it forbids

A `flex` element that is a row — it carries `flex` but not `flex-col` — with two or more direct `Element` children that are each a column — carrying both `flex` and `flex-col`. That shape is a two-dimensional table expressed as nested one-dimensional flex boxes: rows running one way, columns running the other, three files and two components apart from each other.

The check is direction-specific, not symmetric. A `flex flex-col` parent whose children are `flex` rows is the opposite nesting — a column of rows — and is deliberately not flagged: a vertical stack of horizontal toolbars, form rows, or list items is an ordinary one-dimensional layout, not a disguised grid. Only a row of two-or-more columns is a grid you have not written yet; a row with a single column child is not "nested" in the sense this rule cares about, since one column carries no second dimension to state.

## Why

`grid grid-cols-N gap-m` states a two-dimensional arrangement in one line, on one element: how many columns, and the gap between every cell in both directions. The nested-flex equivalent spreads the same fact across a parent (`flex`) and every child (`flex flex-col`), so a reader has to visit each child to confirm they line up into columns at all, and the gap between columns is usually reinvented per child with margin or padding rather than stated once. `no-space-utility` already forbids one form of that reinvention (margin-via-`space-*`); this rule targets the structural cause — the row-of-columns shape — that makes reinventing a gap tempting in the first place.

## Accepted form

    <div class="grid grid-cols-2 gap-m">
      <div>...</div>
      <div>...</div>
    </div>

    <!-- a column of rows is the opposite direction and is not flagged -->
    <div class="flex flex-col gap-m">
      <div class="flex gap-s">...</div>
      <div class="flex gap-s">...</div>
    </div>

## Rejected form

    <div class="flex">
      <div class="flex flex-col">...</div>
      <div class="flex flex-col">...</div>
    </div>

## Measured count: zero, and that is the point

This rule is structural, not greppable — matching it requires walking parent/child class pairs, which is exactly what `no-nested-flex-grid.ts` does and a text search cannot. Running it against the full app surface (187 files linted via `npm run lint`) found **zero** violations, out of 235 `flex` classes across app templates. That is expected, not a sign of a broken or pointless rule: this repo is a template every clone inherits, and the rule's job is prevention, not correction — the same role `no-raw-icon` and `no-ng-class-style` play elsewhere in this enforcement plan. The team already reaches for `grid` when a layout is genuinely two-dimensional; the rule's job is to keep it that way once templates are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-nested-flex-grid.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It only looks at direct children, so a row-of-columns shape hidden behind an intermediate wrapper element — a row containing two plain `div`s that each contain a `flex flex-col` — is invisible to it. It also only reads static `class` attribute text: a row or column assembled at runtime through `[ngClass]` or a runtime-built `[class]` binding never appears as literal `flex`/`flex-col` tokens in the template. Finally, it does not check that the "columns" are actually meant to align side by side as a table would — a row that happens to hold two unrelated flex-column widgets, not intended as grid cells, still reports; that judgment call is left to the fix, which is expected to write an explicit `grid` only when the shape really is tabular.
