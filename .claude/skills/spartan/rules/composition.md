# Component composition

Most spartan components are made of several directives/components that must be nested correctly.
Import the per-component `*Imports` const (e.g. `HlmDialogImports`, `HlmCardImports`) and add it to
your standalone component's `imports`. Always confirm selectors via the docs or MCP before writing
templates - the examples below are canonical but APIs evolve.

## Items belong inside their group

- `hlm-select-item` goes inside `hlm-select-content` (and optionally `hlm-select-group`).
- `button[hlmToggleGroupItem]` goes inside `hlm-toggle-group`.
- `button[hlmTabsTrigger]` goes inside `hlm-tabs-list`.
- Accordion: `hlm-accordion-trigger` and `hlm-accordion-content` go inside `hlm-accordion-item`,
  which goes inside `hlm-accordion`.

## The required-child trap: markup that compiles and renders nothing

This is the failure mode that costs the most time here, because every signal says the code is fine.
The selectors are real, the template compiles, the component mounts, a test that checks it mounted
passes - and the user sees nothing. It has bitten this repo five times through five different
mechanisms, so there is no shortcut: **read the component's template before you compose it.**

### 1. Named projection slots

If a component's template has `<ng-content select="...">`, something must be projected into it or
that part of the component does not exist. Three components in the library are like this, and
omitting the child breaks rendering outright:

| Component | Required child | What you get without it |
|---|---|---|
| `hlm-radio` | `<hlm-radio-indicator indicator />` | the label as bare text, no radio button at all |
| `hlm-avatar` | `[hlmAvatarImage]` **or** `[hlmAvatarFallback]` | a completely empty avatar |
| `hlm-carousel` | `hlm-carousel-content` | an empty carousel with working arrows |

`hlm-avatar` deserves the detail, because its template is an either/or rather than a plain slot:

```html
@if (_image()?.canShow()) { <ng-content select="[hlmAvatarImage]" /> }
@else { <ng-content select="[hlmAvatarFallback]" /> }
```

Give it neither and both branches project nothing. A fallback alone is fine - that is the default
path, not a degraded one.

`date-picker` also has named slots (`[hlmDatePickerHeader]`, `[hlmDatePickerFooter]`) but they are
**additive**: they wrap a calendar the component renders itself, so omitting them costs you nothing.
Having a slot is not the same as needing one - check which kind you are looking at.

### 2. The inverse: components that project nothing

`hlm-spinner` has no `<ng-content>` at all. Content placed inside it is discarded silently, so it
must stay self-closing. The mirror image of the radio trap, and just as invisible.

`hlm-switch` renders `<brn-switch-thumb hlm />` internally - it needs no projected thumb, unlike
`hlm-radio` which needs a projected indicator. **Two components, same conceptual part, opposite
contracts.** Nothing about one tells you anything about the other.

### 3. Required siblings, not children

Same symptom, different mechanism. The child is not inside the component - it sits beside it:

- **`hlm-radio`**: its label is a *sibling* tied by `inputId`, never content inside the component.
  Same for `hlm-checkbox` and `hlm-switch`.
- **`navigation-menu`**: `button[hlmNavigationMenuTrigger]` needs a sibling
  `hlm-navigation-menu-content *hlmNavigationMenuPortal`. Without it the trigger opens nothing.

```html
<hlm-radio value="free" inputId="plan-free">
	<hlm-radio-indicator indicator />
</hlm-radio>
<label hlmLabel for="plan-free">Free</label>
```

### 4. Triggers bound to a template

`dropdown-menu`, `context-menu` and `menubar` all take the panel as a template reference. Omit the
binding and the trigger compiles, renders, and opens nothing:

```html
<button hlmBtn [hlmDropdownMenuTrigger]="menu">Open</button>
<ng-template #menu>
	<hlm-dropdown-menu>
		<button hlmDropdownMenuItem>Profile</button>
	</hlm-dropdown-menu>
</ng-template>
```

Two related facts: `HlmContextMenuImports` and `HlmMenubarImports` export only their trigger and bar
- the panel underneath is `hlm-dropdown-menu` in all three cases, so there is no
`hlm-context-menu-item` to find. And a bracket-bound directive selector is not a DOM attribute, so
`querySelector('[hlmContextMenuTrigger]')` matches nothing; the trigger carries
`data-slot="context-menu-trigger"`.

### How to check in one command

```bash
grep -rn '<ng-content select=' frontend/libs/ui/<component>/src/lib/
```

Empty output means no slot to fill. Output means find out what goes in it. Then **assert the
rendered DOM**, not that the component mounted - a test that only checks mounting will pass on every
one of the failures above.

## Overlays need a title

Dialog, Sheet, and Alert Dialog must have a title for accessibility. If the design hides it, keep it
present and apply `class="sr-only"`.

```html
<hlm-dialog>
	<button hlmDialogTrigger hlmBtn>Edit profile</button>
	<hlm-dialog-content *hlmDialogPortal class="sm:max-w-[425px]">
		<hlm-dialog-header>
			<h3 hlmDialogTitle>Edit profile</h3>
			<p hlmDialogDescription>Make changes to your profile here.</p>
		</hlm-dialog-header>
		<div class="py-4">
			<input hlmInput placeholder="Name" />
		</div>
		<hlm-dialog-footer>
			<button hlmBtn hlmDialogClose>Save changes</button>
		</hlm-dialog-footer>
	</hlm-dialog-content>
</hlm-dialog>
```

Sheet mirrors this (`hlmSheetTrigger`, `*hlmSheetPortal`, `hlm-sheet-content`, `hlm-sheet-header`,
`hlmSheetTitle`). The `side` input (`top | bottom | left | right`) goes on the root `<hlm-sheet>`
element, not on the content: `<hlm-sheet side="right">`.

## Full Card composition

Use the structural pieces rather than styling a bare `div`.

```html
<section hlmCard>
	<div hlmCardHeader>
		<h3 hlmCardTitle>Create project</h3>
		<p hlmCardDescription>Deploy in one click.</p>
	</div>
	<div hlmCardContent>...</div>
	<div hlmCardFooter class="justify-between">
		<button hlmBtn variant="ghost">Cancel</button>
		<button hlmBtn>Create</button>
	</div>
</section>
```

## Tabs

```html
<hlm-tabs tab="account">
	<hlm-tabs-list>
		<button hlmTabsTrigger="account">Account</button>
		<button hlmTabsTrigger="password">Password</button>
	</hlm-tabs-list>
	<div hlmTabsContent="account">...</div>
	<div hlmTabsContent="password">...</div>
</hlm-tabs>
```

## Avatar: the canonical full form

Why a child is required is covered under the required-child trap above; this is the shape to copy
when you have an image. The fallback is what renders while the image loads or if it fails.

```html
<hlm-avatar>
	<img hlmAvatarImage src="/avatar.jpg" alt="Jane Doe" />
	<span hlmAvatarFallback>JD</span>
</hlm-avatar>
```

## Buttons have no loading input

There is no `isLoading`/`isPending` input on `hlmBtn`. Compose a `hlm-spinner` and disable the
button:

```html
<button hlmBtn [disabled]="saving()">
	@if (saving()) {
	<hlm-spinner />
	} Save
</button>
```

## Use components, not custom markup

- Callouts / inline messages -> `hlmAlert` (with `hlmAlertTitle` / `hlmAlertDescription`).
- Empty states -> `hlm-empty` (`hlmEmptyMedia`, `hlmEmptyTitle`, `hlmEmptyDescription`).
- Toasts -> the `sonner` component: place `<hlm-toaster />` once, then call `toast(...)` from
  `@spartan-ng/brain/sonner` (`toast.success`, `toast.error`, etc.).
- Dividers -> `hlm-separator`, not `<hr>`.
- Loading placeholders -> `hlmSkeleton`, not custom pulsing divs.
- Status pills -> `hlmBadge`, not custom styled spans.
- Loading indicator -> `hlm-spinner`.
