# no-raw-palette-color

> Engine: `tools/lint/rules/no-raw-palette-color.ts`.

## What it forbids

A Tailwind utility that names a raw palette color instead of a semantic token, on any color-bearing prefix: `bg`, `text`, `border`, `ring`, `fill`, `stroke`, `from`, `via`, `to`, `divide`, `outline`, `decoration`, `placeholder`, `caret`, `accent`. Three shapes trip it: a palette name plus a numeric shade (`bg-blue-500`, `text-gray-700`), a hex color in an arbitrary-value bracket (`bg-[#0af]`), and the literal `white` or `black` (`text-white`). The check runs on `baseUtility(cls)` from `tools/lint/ast.ts`, so a responsive or state prefix does not hide a violation: `dark:bg-blue-600` is still `bg-blue-600` underneath and still reports.

An arbitrary value that is not a color is untouched: `sm:max-w-[425px]` is an arbitrary value on `max-w`, which is not in the color-prefix list, so the rule has no opinion on it. A semantic token such as `bg-card` or `text-muted-foreground` does not match the palette-name-plus-shade pattern (`card` and `muted-foreground` are not `[a-z]+-\d{2,3}`), so it passes.

## Why

This app's palette is pure neutral with one chromatic token, expressed as semantic CSS variables in `frontend/src/styles.css` (`bg-card`, `text-muted-foreground`, `text-destructive`, and so on), defined once for light mode and once for dark. A raw palette utility bypasses that layer entirely: `bg-blue-500` paints the same blue in light and dark mode, ignores whatever the destructive or accent token is supposed to mean, and cannot be retinted by changing one token definition. `bg-[#0af]` and `text-white`/`text-black` are the same failure by a different route — a literal color value hard-coded into a template instead of a name that resolves through the token layer.

## Accepted form

    <div class="bg-card text-muted-foreground">
    <div class="text-destructive">
    <div class="sm:max-w-[425px]">

## Rejected form

    <div class="bg-blue-500">
    <div class="text-gray-700">
    <div class="bg-[#0af]">
    <div class="dark:bg-blue-600">
    <div class="text-white">

## Measured count: zero, and that is the point

This rule finds **zero** violations in the current codebase — there is not one palette-name-plus-shade class, hex-bracket color, or literal `white`/`black` in any app template, showcase page included. That is expected, not a sign of a broken or pointless rule: this repo is a template every clone inherits, and the rule's job is prevention, not correction — the same role `no-raw-icon` and `no-ng-class-style` play elsewhere in this enforcement plan. The team already uses semantic tokens throughout by convention; the rule's job is to keep it that way once templates are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-raw-palette-color.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads static `class` attribute text only. A palette color assembled at runtime — built into a string in a component and bound through `[class]` or `[ngClass]` — never appears as a literal class token in a template and is invisible to a template-only rule. `no-ng-class-style` closes part of that gap by forbidding `ngClass`/`ngStyle` outright, but a runtime-built plain `[class]` binding is still outside this rule's reach. It also has no opinion on whether a semantic token itself is well-chosen — only on whether a class resolves through the token layer at all.
