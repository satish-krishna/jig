# no-literal-spacing

> Engine: `tools/lint/rules/no-literal-spacing.mjs`. Scale: `tools/design-tokens/spacing.ts`. Decision: ADR 0011.

## What it forbids

A spacing utility carrying a numeric or arbitrary value instead of a named step, in any app template. Responsive and state prefixes are stripped before deciding, so `sm:gap-2` and `dark:hover:p-4` both trip it.

Families governed: `gap`, `gap-x`, `gap-y`, `p`, `px`, `py`, `pt`, `pb`, `pl`, `pr`, `ps`, `pe`, `m`, `mx`, `my`, `mt`, `mb`, `ml`, `mr`, `ms`, `me`.

## Why

Tailwind keeps `gap-2` resolving after the token scale exists, so the tokens enforce nothing on their own. Without this rule, spacing drifts back to literals the first time somebody types a number, and the scale becomes decoration.

The point of the scale is uniformity. Nine distinct magnitudes across an app of this size is not a design language, it is nine decisions nobody made together.

## Accepted form

    <section class="grid gap-m">
    <div class="px-l py-s">
    <p class="mt-xs">

Steps: `xs` 4px, `s` 8px, `m` 12px, `l` 16px, `xl` 24px, `2xl` 32px.

## Exempt

`0`, `auto` and `px` are not steps on any scale. `gap-0` is the absence of spacing, `mx-auto` is centring, and `gap-px` is the 1px hairline `design.md` declares a primitive of the language.

## Known blind spots

It reads static `class` attributes only. A class list built by `[class]`, `ngClass`, or `cn()` in TypeScript is invisible to it, and nothing gates that today: `frontend/src/app/showcase/pages/avatar.page.ts:59` uses `[class]` and `popover.page.ts:81` uses `[class.font-medium]` right now, unflagged. A rule closing this gap is not yet written.

It cannot govern `libs/ui`, which is generated and ignored. Spartan inlines its own half-steps (`px-2.5`, `gap-1.5`), so a primitive's internal padding sits up to 2px off this grid. That split is permanent for as long as the vendored kit uses a different rhythm, and it is recorded in ADR 0011.
