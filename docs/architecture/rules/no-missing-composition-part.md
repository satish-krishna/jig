# no-missing-composition-part

> Engine: `tools/lint/rules/no-missing-composition-part.ts`.

## What it forbids

One of three overlay container elements — `hlm-dialog-content`, `hlm-sheet-content`, `hlm-alert-dialog-content` — appearing without a descendant carrying its required title directive:

    hlm-dialog-content        -> hlmDialogTitle
    hlm-sheet-content         -> hlmSheetTitle
    hlm-alert-dialog-content  -> hlmAlertDialogTitle

The search is a pure parent/child containment walk over the one template AST the rule is given: no cross-file join, no type information, no knowledge of what a directive does. It walks every descendant reachable from the container node, not only its direct children, and it descends through Angular control-flow blocks (`@if`, `@for`, `@switch`, `@defer`) the same way it descends through a plain wrapping `<div>` — a required part sitting inside an `@if` still satisfies the container, because the walk follows every property of every node that itself looks like an AST node (has a string `type`), not just a hard-coded `children` array. That generality is deliberate: `@if` nests its content behind `branches[].children`, `@switch` behind `cases[].children`, `@for` behind `children`/`empty`, and `@defer` behind `children`/`placeholder`/`loading`/`error` — four different key shapes for the same idea. Naming each one by hand in the walk would need a new case every time a new control-flow form is added; walking every node property once already covers all of them.

## Why

`hlm-dialog-content`, `hlm-sheet-content`, and `hlm-alert-dialog-content` are all overlays: they render outside the normal document flow and, semantically, need an accessible name for assistive technology to announce what just took focus. The corresponding `hlmDialogTitle` / `hlmSheetTitle` / `hlmAlertDialogTitle` directive is how this codebase supplies that name — dropping it is not a style nit, it is an overlay a screen reader user cannot identify. Because the composition is call-site discipline (spartan does not force a title at compile time; you can build the container without one), only a template-shape check like this one catches the omission before someone ships it.

## Accepted form

    <hlm-dialog-content>
      <h3 hlmDialogTitle>Edit profile</h3>
      ...
    </hlm-dialog-content>

    <hlm-dialog-content>
      @if (mode() === 'edit') {
        <h3 hlmDialogTitle>Edit profile</h3>
      }
      ...
    </hlm-dialog-content>

## Rejected form

    <hlm-dialog-content><p>no title</p></hlm-dialog-content>

A violation inside a showcase page demonstrating a title-less dialog is still a real violation, not a false positive to special-case: an overlay without an accessible name is a defect whether or not the surrounding page is a demo. The fix is to add the title, not to suppress the rule.

## Measured count

Zero, against the real application and showcase templates as of this rule's introduction. A raw grep across the repository shows a much wider gap — 35 occurrences of `hlm-dialog-content` against 11 of `hlmDialogTitle` — but almost all of that gap lives inside showcase `readonly codeX = \`...\`` string literals: TypeScript string values shown to the reader as a code sample, not parsed Angular templates, so the rule (which only ever sees real template ASTs) correctly does not see them. Every actual inline `@Component` template in `dialog.page.ts`, `sheet.page.ts`, and `alert-dialog.page.ts` already pairs its container with the required title directive.

## Known blind spots

It has no type information: it does not confirm that the container is really the `HlmDialogContent`/`HlmSheetContent`/`HlmAlertDialogContent` directive rather than a coincidentally-named custom element, and it does not confirm that the title directive found is really `HlmDialogTitle` rather than a same-named attribute on an unrelated element. It also cannot see a title supplied by a child Angular component's own template — the walk only descends into nodes present in the same template AST, so a title rendered by `<my-dialog-header>` whose own component template contains the `hlmDialogTitle` element is invisible from the container's template.
