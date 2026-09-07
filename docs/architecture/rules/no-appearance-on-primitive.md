# no-appearance-on-primitive

> Engine: `tools/lint/rules/no-appearance-on-primitive.ts`. Predicates: `tools/lint/ast.ts` (`classAttribute`). Vocabulary: `tools/lint/vocabulary.ts` (`attributeSelectors`, `elementSelectors`, `appearanceFamilyOf`, `appearanceFamiliesOf`).

## What it forbids

A class on an element that carries a spartan primitive — either a primitive attribute directive (`hlmBtn`, `hlmCardFooter`, ...) or a primitive element tag (`hlm-dialog-content`, `hlm-alert`, ...) — that overrides an appearance family **that primitive's own styling actually sets**. Responsive and state prefixes are stripped before a class is classified, so `dark:bg-blue-600` and `sm:p-4` both trip it exactly like `bg-blue-600` and `p-4` would.

The rule is deliberately **family-granular, not class-exact**. `hlm-command`'s own styling sets decoration through `rounded-xl`; a call-site `border` still fights it, even though `border` is not the exact class `hlm-command` writes. Checking for the exact class instead of the family would miss that: two different decoration classes on the same element still both target `border-*`/`border-radius` and still fight for the same visual outcome by CSS cascade order, silently, per call site. See "How the check works" below for what changed here from the rule's first version and why.

## The appearance/layout split

Color, typography, decoration, and internal padding are the governed families; layout (display, flex/grid arrangement, dimensions, margin, position) is deliberately absent, because a primitive has no opinion on how it sits relative to its neighbours and must not pretend to.

**Appearance families:**

- **color** — `bg-*`; `text-*` color (any `text-*` that is not a size keyword or an alignment keyword)
- **typography** — `font-*`, `leading-*`, `tracking-*`; `text-*` size (`text-xs` … `text-9xl`)
- **decoration** — `border`, `border-*`, `rounded`, `rounded-*`, `shadow`, `shadow-*`, `ring`, `ring-*`
- **padding** — `p-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, `pl-*`, `pr-*`

**Alignment is layout, not typography.** `text-left`, `text-center`, `text-right`, `text-justify`, `text-start`, `text-end` control where content sits inside a box, not what the text looks like. They are exempt from the `text-*` color/typography split above and are always allowed.

**Layout — always allowed on a primitive.**

- `display`, `flex-*`, `grid-*`, `justify-*`, `items-*`, `gap-*` — arrangement
- `w-*`, `h-*`, `min-*`, `max-*` — dimensions
- `m-*`, `mx-*`, `my-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*` — margin
- `absolute`, `relative`, `fixed`, `sticky`, `top-*`, `left-*`, ... — position

## How the check works

A call-site class is a violation only when **the specific primitive present on that element** actually renders something in the same family, derived from that primitive's own `classes()` call in `frontend/libs/ui/**` (never hand-maintained — see `appearanceFamiliesOf` in `vocabulary.ts`). `hlm-resizable-group`'s entire styling is `'group flex h-full w-full data-[panel-group-direction=vertical]:flex-col'` — no decoration, no padding, no color, no typography — so a call-site `border` or `rounded-lg` on it is not an override of anything, it is the only source of that appearance the element will ever get. `hlmBtn`'s cva base and variants render color, typography and decoration, so a call-site `bg-muted` genuinely fights it.

This replaced the rule's first version, which flagged any class matching a governed family pattern on ANY primitive, regardless of whether that specific primitive rendered anything in that family. That version deleted borders and rounding from `hlm-resizable-group`, `ng-scrollbar[hlm]` and `div[hlmEmpty]`'s outline variant in showcase pages — sites where spartan's own documentation adds exactly those classes at the call site, because the primitive is deliberately shipped bare so it can be framed standalone or composed inside an already-decorated container without doubling up. The class-string comparison did not distinguish "this primitive sets no decoration at all" from "this primitive sets decoration, just not this exact value" — both read as "not an exact duplicate," but only the first is a real addition rather than an override. Family-granular derivation is what makes that distinction: it asks "does this primitive's own styling touch this VISUAL CONCERN at all," not "does it write this exact utility."

### Three states, not two

A directive's own class list is declared one of three ways in `frontend/libs/ui/**`: an inline literal or array right in the `classes(() => ...)` call, a `cva('base', { variants: {...} })` result, or a bare reference to a same-file `export const NAME = '...'` plain string (every typography directive — `hlmH1`, `hlmMuted`, `hlm-separator`, and the rest — uses this third shape). `resolveClassExpr` in `vocabulary.ts` resolves all three, plus the ternaries, `&&` guards, block-bodied arrow functions, and `this.foo()`/`this.foo` runtime accessors that show up inside them.

When a `classes()` call resolves to none of those shapes, that call is UNRESOLVED — a distinct state from "resolved, and happens to render no appearance" (true of `hlm-resizable-group`) and from "no `classes()` call at all" (true of most behaviour-only directives). `appearanceFamiliesOf` never folds UNRESOLVED into an empty `Set`; `unresolvedAppearanceSelectors()` is the only place that state surfaces, and a coverage test in `vocabulary.test.ts` walks every directive under `frontend/libs/ui` with a `classes(` call and asserts that set is empty. This exists because the rule's second version shipped exactly the defect it was meant to prevent: `classes(() => hlmH1)` — a bare reference to a same-file constant, the third shape above — did not resolve, and an empty `Set` from a resolution failure was indistinguishable from an empty `Set` from a primitive that genuinely sets nothing. `<hlm-separator class="bg-red-500">`, `<div hlmBlockquote class="pl-0">` and `<div hlmH1 class="text-sm">` all passed silently under that version, despite each primitive setting the family being overridden. If a future spartan upgrade introduces a fourth way to declare a directive's classes, the coverage test goes red naming the file, instead of the rule quietly going blind on it the way it did here.

## Known exceptions

A hand-maintained, deliberately short list in `no-appearance-on-primitive.ts` (`EXCEPTIONS`), keyed `primitiveName:family`, for a primitive where overriding its own class is not a fight, it is the only API spartan exposes for that concern.

- **`hlm-spinner:typography`** — `HlmSpinner` has no size input. It sizes its icon entirely through its own base class (`text-[length:--spacing(4)]`), and spartan's own "Sizes" documentation example resizes it by overriding that exact class (`text-xs`, `text-base`, `text-2xl`, ...). Forbidding a call-site `text-*` override here would forbid the only way to size a spinner. (The derivation in `vocabulary.ts` does not actually detect `hlm-spinner` as setting typography on its own — `text-[length:...]` embeds a colon inside its own brackets, which defeats the prefix-stripping the classifier relies on for responsive/state variants, so `hlm-spinner` derives as setting no families at all. That gap happens to agree with exempting it, but this entry exists so the exemption is a written decision, not an accident of one arbitrary-value parsing quirk.)

One exception with a stated reason is defensible. A growing list here is how a gate like this rots: if a second candidate ever seems to need one, stop and report it rather than adding it — see the note at the top of `EXCEPTIONS` in the rule file.

## Accepted form

    <button hlmBtn class="w-full">Save</button>
    <div hlmCardFooter class="justify-between"></div>
    <hlm-dialog-content class="sm:max-w-[425px]"></hlm-dialog-content>
    <button hlmBtn class="text-left">Save</button>
    <hlm-resizable-group class="rounded-lg border"></hlm-resizable-group>
    <hlm-spinner class="text-xl" />

## Rejected form

    <button hlmBtn class="bg-muted">Save</button>
    <hlm-alert class="rounded-none"></hlm-alert>
    <button hlmBtn class="dark:bg-blue-600">Save</button>
    <hlm-command class="border"></hlm-command>

## Known blind spots

- It reads static `class` attributes only, the same limitation `no-literal-spacing` documents. A class list assembled through `[class]`, `ngClass`, or `cn()` in TypeScript is invisible to it.
- The family deriver pools a primitive's cva base string with every one of its variant strings, because any variant may render depending on an input the call site never controls; it does not track which variant is actually active. This is a deliberate over-approximation — a family is "set" if the primitive could EVER render it — not an exact one.
- The bare attribute name `hlm` is reused, unrelated to each other, by four different directives (`ng-scrollbar[hlm]`, `brn-input-otp[hlm]`, `brn-slider [hlm]`, `brn-switch-thumb[hlm]`). The vocabulary this rule shares with `no-unknown-primitive` has always treated attribute names as a flat set with no notion of "which directive", so the derived family set for `hlm` is the union across all four. This can only make the rule MORE permissive than exactly correct for that one shared name (a family genuinely set by one of the four looks set for all four), never less — it has caused no incorrect violation in this codebase today, and is recorded here rather than fixed, since disambiguating it is a larger vocabulary change than this rule needs on its own.
- It uses the same `attributeSelectors()` / `elementSelectors()` vocabulary as `no-unknown-primitive`, generated from `libs/ui`. A primitive not yet installed carries no selector and is invisible to this rule, exactly as it is to that one.
