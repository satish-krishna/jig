# no-style-attribute

> Engine: `tools/lint/rules/no-style-attribute.ts`.

## What it forbids

A static `style="..."` attribute (an angular-eslint `TextAttribute`) anywhere in an app template. A bound `[style.foo]="expr"` is a different attribute kind — a `BoundAttribute` — and is left alone, because its value is dynamic and cannot be expressed as a class.

## Why

A literal `style` attribute sets CSS directly on the element, bypassing every design token and every utility class the rest of the app is held to. `no-literal-spacing` and `no-appearance-on-primitive` both work by reading class lists; a hand-written `style` string is invisible to both and is exactly the escape hatch those rules exist to close. If `style="..."` is allowed anywhere, it is the path every future shortcut takes.

## Accepted form

    <div class="grid gap-m">
    <div [style.width]="dynamicWidth()">

## Rejected form

    <div style="display: grid; gap: 12px">
    <div style="display: contents">

The second example above is exactly `no-style-attribute`'s one measured hit on this branch: `frontend/src/app/shell/app-shell.ts` used `style="display: contents"` to make a wrapper `<div>` disappear from the grid without disappearing from the DOM. The fix is `class="contents"` — Tailwind ships `contents` as a real `display: contents` utility, so the static value has a token-backed equivalent and the attribute is not needed at all.

## Known blind spots

It reads static `TextAttribute` nodes only. It has no opinion on inline styles set from TypeScript (`ElementRef.nativeElement.style`, `[ngStyle]`, a `Renderer2` call) — those never appear as a `style="..."` string in a template and are invisible to a template-only rule.
