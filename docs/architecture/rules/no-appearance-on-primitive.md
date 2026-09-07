# no-appearance-on-primitive

> Engine: `tools/lint/rules/no-appearance-on-primitive.ts`. Predicates: `tools/lint/ast.ts` (`classAttribute`, `baseUtility`). Vocabulary: `tools/lint/vocabulary.ts` (`attributeSelectors`, `elementSelectors`).

## What it forbids

A class on an element that carries a spartan primitive — either a primitive attribute directive (`hlmBtn`, `hlmCardFooter`, ...) or a primitive element tag (`hlm-dialog-content`, `hlm-alert`, ...) — that overrides the primitive's **appearance**. Responsive and state prefixes are stripped before a class is classified, so `dark:bg-blue-600` and `sm:p-4` both trip it exactly like `bg-blue-600` and `p-4` would.

## The appearance/layout split

This split is the entire rule. Get it wrong and the rule is either useless (misses real overrides) or hostile (blocks legitimate layout classes at every call site). Spartan's own styling documentation draws this line; the rule enforces it rather than inventing a new one.

**Appearance — forbidden on a primitive.** Color, typography, decoration, and internal padding: the primitive already owns these, and a call-site override means the primitive's own styling is fighting the class typed next to it.

- `bg-*` — background color
- `font-*` — font family and weight
- `leading-*` — line height
- `tracking-*` — letter spacing
- `border`, `border-*` — border width and color
- `rounded`, `rounded-*` — corner radius
- `shadow`, `shadow-*` — box shadow
- `ring`, `ring-*` — focus/outline ring
- `p-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, `pl-*`, `pr-*` — internal padding
- `text-*` **except** the alignment keywords below — text color, size, weight, decoration

**Alignment is layout, not typography.** `text-left`, `text-center`, `text-right`, `text-justify`, `text-start`, `text-end` control where content sits inside a box, not what the text looks like. They are exempt from the `text-*` appearance family and are always allowed.

**Layout — always allowed on a primitive.** Display, flex/grid arrangement, dimensions, margin, and position are the call site's business: the primitive has no opinion on where it sits or how big its box is, only on how it looks inside that box.

- `display`, `flex-*`, `grid-*`, `justify-*`, `items-*`, `gap-*` — arrangement
- `w-*`, `h-*`, `min-*`, `max-*` — dimensions
- `m-*`, `mx-*`, `my-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*` — margin
- `absolute`, `relative`, `fixed`, `sticky`, `top-*`, `left-*`, ... — position

## Why

A primitive's whole purpose is to own its appearance so every call site renders the same button, the same alert, the same dialog surface. A class that overrides `bg-*` or `p-*` at the call site is not customizing the primitive, it is fighting it — the two declarations both target the element and one of them wins by CSS specificity or source order, silently, per call site. That is exactly the drift `no-literal-spacing` and `no-raw-control` exist to prevent, aimed at a different failure mode of the same problem: forgetting that a shared component is shared.

Layout is excluded on purpose, not by omission. A button inside a `flex` row legitimately needs `w-full` or `ml-auto` at that specific call site — the primitive has no way to know how it will be arranged relative to its neighbours, so it must not have an opinion on that, and this rule must not either.

## Accepted form

    <button hlmBtn class="w-full">Save</button>
    <div hlmCardFooter class="justify-between"></div>
    <hlm-dialog-content class="sm:max-w-[425px]"></hlm-dialog-content>
    <button hlmBtn class="text-left">Save</button>

## Rejected form

    <button hlmBtn class="bg-muted">Save</button>
    <hlm-alert class="rounded-none"></hlm-alert>
    <button hlmBtn class="dark:bg-blue-600">Save</button>

## Known blind spots

- It reads static `class` attributes only, the same limitation `no-literal-spacing` documents. A class list assembled through `[class]`, `ngClass`, or `cn()` in TypeScript is invisible to it.
- It classifies by prefix pattern, not by resolving the actual generated CSS. A future Tailwind utility that happens to start with one of the governed prefixes but means something else would be misclassified; none is known to exist in this codebase today.
- It uses the same `attributeSelectors()` / `elementSelectors()` vocabulary as `no-unknown-primitive`, generated from `libs/ui`. A primitive not yet installed carries no selector and is invisible to this rule, exactly as it is to that one.
