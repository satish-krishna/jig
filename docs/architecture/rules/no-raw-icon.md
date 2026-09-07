# no-raw-icon

> Engine: `tools/lint/rules/no-raw-icon.ts`.

## What it forbids

A pasted `<svg>` root element anywhere in an app template. Angular's template compiler and the angular-eslint template parser both namespace SVG content, so a root `<svg>` arrives at the rule as the element name `:svg:svg`. The rule matches that exact name, not a prefix: an `<svg>` element's own descendants (`:svg:path`, `:svg:g`, `:svg:circle`, and so on) are namespaced the same way, and matching a prefix would report once per descendant of a single pasted icon instead of once for the icon itself.

## Why

This app's icon registry is `provideIcons` plus `<ng-icon name="...">` (see `frontend/src/app/app.config.ts`). Pasting a raw `<svg>...</svg>` blob copied from an icon site bypasses that registry entirely: the glyph is not registered anywhere, cannot be swapped by changing one `provideIcons` call, is not color- or size-token aware the way `<ng-icon>` is, and is invisible to anything that later wants to enumerate "every icon this app uses." A hand-pasted `<svg>` today is copy-pasted twice tomorrow, and the registry stops being the single source of icons the moment the first exception exists.

## Accepted form

    <ng-icon name="lucideUsers" />

## Rejected form

    <svg viewBox="0 0 24 24"><path d="M0 0"/></svg>

## Measured count: zero, and that is the point

This rule finds **zero** violations in the current codebase — there is not one raw `<svg>` in any app template, showcase page included. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the same role `no-unregistered-icon` plays later in this enforcement plan for icon names that exist in a template but were never registered with `provideIcons`. The team already does the right thing here by convention; the rule's job is to keep it that way once templates are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-raw-icon.test.ts` `RuleTester` case is what proves the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads element names only. An `<svg>` produced dynamically — written into the DOM by a directive's host binding, or injected via `[innerHTML]` — never appears as a literal `<svg>` element in a template and is invisible to a template-only rule. It also has no opinion on whether an `<ng-icon name="...">` is a valid, currently-registered glyph name; catching an unregistered name is a separate rule's job.
