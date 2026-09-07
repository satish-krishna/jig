# no-raw-control

> Engine: `tools/lint/rules/no-raw-control.ts`. Vocabulary: `tools/lint/vocabulary.ts`.

## What it forbids

A native control element used bare, when `libs/ui` ships a primitive that styles it. The full map lives in `tools/lint/vocabulary.ts`; in outline:

    button    -> hlmBtn, hlmSidebarMenuButton, hlmToggle, hlmPaginationLink,
                 plus every compound-component child directive that styles a
                 <button> on its own: hlmToggleGroupItem, hlmTabsTrigger,
                 hlmDropdownMenuItem/Checkbox/Radio/SubTrigger, hlmMenubarTrigger,
                 hlmNavigationMenuTrigger, hlmAlertDialogAction/Cancel,
                 hlmSidebarGroupAction/MenuAction/MenuSubButton/GroupLabel/Rail,
                 hlmCommandItem (and its hlm-command-item alias), hlmComboboxChipRemove,
                 hlmCarouselNext/Previous (and their hlm-carousel-* aliases),
                 hlmInputGroupButton
    input     -> hlmInput, hlmInputGroupInput, hlmComboboxChipInput, hlmSidebarInput
    textarea  -> hlmTextarea, hlmInputGroupTextarea
    table     -> hlmTable

Several native elements list more than one primitive because several helm directives style the same element in different compositions — `<button hlmBtn>` and `<button hlmSidebarMenuButton>` are both acceptable buttons. Any ONE listed primitive satisfies the rule; the check is presence of any of them among the element's attributes, not a specific one.

The button/input/textarea lists are each exhaustive over every directive that demonstrably applies its own visual styling to that native tag — verified per entry against the directive source for a `classes()` call, or a `hostDirectives` entry composing the tag's base primitive (`HlmButton`, `HlmInput`, or `HlmTextarea`). A directive that only wires behaviour and applies no styling of its own (`hlmDialogTrigger`, `hlmDialogClose`, `hlmSheetTrigger`, `hlmSheetClose`, `hlmDrawerTrigger`, `hlmDrawerClose`, `hlmCollapsibleTrigger`, `hlmPopoverTrigger`, `hlmAlertDialogTrigger`) is deliberately excluded: this codebase always pairs those with `hlmBtn` (see `dialog.page.ts`, `alert-dialog.page.ts`), so a bare `<button hlmDialogTrigger>` alone is a real violation this rule should catch, not a gap in the map.

## Why

This is deliberately narrowed to controls, not to every native element `libs/ui` has a primitive for. Three reasons:

1. The reference angular-jig rule this is ported from scopes itself to "a native CONTROL element used where a spartan primitive exists." Controls, not typography.
2. A bare `<button>` is always wrong — unstyled and unwired to anything real. A bare `<p>` is always fine — it inherits body styling and is exactly what a paragraph should be. The two do not share a predicate, so they cannot share a rule.
3. The wider map (including `h1`-`h4`, `p`, `ul`, `blockquote`, `code`, `label`) was measured against this app: 97 bare occurrences, 49 of them bare `<p>`. Sampling those 49 showed a handful of genuine hand-rolled primitives (`<p class="text-muted-foreground text-sm">`, which is literally `hlmMuted`'s own class string) against dozens of plain showcase prose (`<p>Your plan includes analytics, alerts, and email support.</p>`), which is exactly what a paragraph should be. Flagging all 49 would bury four real defects under forty-five false ones, and a rule that noisy is one people switch off.

Do not widen `NATIVE_TO_PRIMITIVE` back to typography without re-reading this reasoning; the narrowing was a deliberate ruling, not an oversight.

### Why the button/input/textarea lists are longer than they look

Wiring this rule against a first-pass map holding only the four "generic" button primitives (`hlmBtn`, `hlmSidebarMenuButton`, `hlmToggle`, `hlmPaginationLink`) flagged 145 elements, not the roughly 14 expected. Every extra hit traced back to the same cause: a compound component's own child directive — `<button hlmToggleGroupItem>`, `<button hlmTabsTrigger="...">`, `<button hlmDropdownMenuItem>`, and the rest listed above — is frequently the *only* styling a control needs, exactly the same way `<button hlmBtn>` needs nothing else. None of those were bare controls; they were controls the map did not yet recognize. Completing the lists (verified per entry, not by guessing) brought the count down to 8: 5 bare `<button>`, 2 bare `<input>`, 1 bare `<table>`, 0 bare `<textarea>`. This is the same shape of mistake `no-unknown-primitive`'s jig-specific correction guards against — assuming a smaller, tidier vocabulary than the one actually installed — so anyone extending either rule to a new tag should expect to do this same source-reading pass before trusting a first violation count.

## Accepted form

    <button hlmBtn>Save</button>
    <button hlmSidebarMenuButton>Nav</button>
    <input hlmInput />
    <table hlmTable>...</table>

## Known blind spots

- It reads static attributes and bound-property names only. It has no way to know whether a value bound through `[attr.foo]` or a structural directive supplies styling; it looks only at attribute and input names actually present on the element node.
- It cannot see a control rendered by a component it does not parse. A native `<button>` wrapped inside a custom Angular component's own template is checked wherever that template lives, but a `<button>` produced dynamically (for example, written into the DOM by a directive's host binding rather than appearing literally in the template) is invisible to it.
- It does not check that the primitive attribute is spelled correctly or actually installed — that is `no-unknown-primitive`'s job. A typo like `hlmBttn` satisfies this rule (an attribute is present) while failing that one.
