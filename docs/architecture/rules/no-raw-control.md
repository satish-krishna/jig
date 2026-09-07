# no-raw-control

> Engine: `tools/lint/rules/no-raw-control.ts`. Vocabulary: `tools/lint/vocabulary.ts`.

## What it forbids

A native control element used bare, when `libs/ui` ships a primitive that styles it. The map, from `tools/lint/vocabulary.ts`:

    button    -> hlmBtn, hlmSidebarMenuButton, hlmToggle, hlmPaginationLink
    input     -> hlmInput
    textarea  -> hlmTextarea
    table     -> hlmTable

Several native elements list more than one primitive because several helm directives style the same element in different compositions — `<button hlmBtn>` and `<button hlmSidebarMenuButton>` are both acceptable buttons. Any ONE listed primitive satisfies the rule; the check is presence of any of them among the element's attributes, not a specific one.

## Why

This is deliberately narrowed to controls, not to every native element `libs/ui` has a primitive for. Three reasons:

1. The reference angular-jig rule this is ported from scopes itself to "a native CONTROL element used where a spartan primitive exists." Controls, not typography.
2. A bare `<button>` is always wrong — unstyled and unwired to anything real. A bare `<p>` is always fine — it inherits body styling and is exactly what a paragraph should be. The two do not share a predicate, so they cannot share a rule.
3. The wider map (including `h1`-`h4`, `p`, `ul`, `blockquote`, `code`, `label`) was measured against this app: 97 bare occurrences, 49 of them bare `<p>`. Sampling those 49 showed a handful of genuine hand-rolled primitives (`<p class="text-muted-foreground text-sm">`, which is literally `hlmMuted`'s own class string) against dozens of plain showcase prose (`<p>Your plan includes analytics, alerts, and email support.</p>`), which is exactly what a paragraph should be. Flagging all 49 would bury four real defects under forty-five false ones, and a rule that noisy is one people switch off.

Do not widen `NATIVE_TO_PRIMITIVE` back to typography without re-reading this reasoning; the narrowing was a deliberate ruling, not an oversight.

## Accepted form

    <button hlmBtn>Save</button>
    <button hlmSidebarMenuButton>Nav</button>
    <input hlmInput />
    <table hlmTable>...</table>

## Known blind spots

- It reads static attributes and bound-property names only. It has no way to know whether a value bound through `[attr.foo]` or a structural directive supplies styling; it looks only at attribute and input names actually present on the element node.
- It cannot see a control rendered by a component it does not parse. A native `<button>` wrapped inside a custom Angular component's own template is checked wherever that template lives, but a `<button>` produced dynamically (for example, written into the DOM by a directive's host binding rather than appearing literally in the template) is invisible to it.
- It does not check that the primitive attribute is spelled correctly or actually installed — that is `no-unknown-primitive`'s job. A typo like `hlmBttn` satisfies this rule (an attribute is present) while failing that one.
