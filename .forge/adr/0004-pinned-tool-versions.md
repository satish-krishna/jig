# ADR 0004 — Two dependency versions are pinned below "latest" for concrete reasons

- Status: accepted
- Date: 2026-07-02
- Scope: `repo`

## Context

The bootstrap says "latest stable" for Angular and names FluentAssertions. Both defaults are wrong for this environment or for a template, so they are chosen deliberately.

## Decision

**Angular pin retired — now on 22.** Angular was initially pinned to 20 because CLI 22 requires Node `^24.15.0` and the environment had `24.12.0`; upgrading the user's Node unattended was out of scope. Once Node moved to `24.18`, the pin was lifted: Angular was updated 20 → 21 → 22 (stepwise, verified between hops), which also unlocked `@angular/forms/signals`. This paragraph is kept as the record of why the pin existed.

**Assertions use Shouldly (not FluentAssertions).** FluentAssertions v8 moved to a commercial Xceed license: commercial use requires a paid per-seat license, and v7 is a frozen Apache-2.0 tail. Rather than pin a dead version, the tests use Shouldly (MIT, actively maintained). Both backend test projects assert with `x.ShouldBe(...)` and friends.

## Consequences

- A fresh clone needs Node in the range Angular 22 requires (`^22.22.3 || ^24.15.0 || >=26.0.0`). `npm run setup` validates the full version and fails early if it is not met, so a diligent user never reaches a cryptic Angular engines error at `verify`.
- No clone inherits a paid or frozen test-assertion dependency.
- The Angular version is now current (22); this ADR remains the record of why it was temporarily pinned to 20, so a future agent understands the history rather than "helpfully" reverting it.
