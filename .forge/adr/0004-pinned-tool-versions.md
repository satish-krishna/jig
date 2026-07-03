# ADR 0004 — Two dependency versions are pinned below "latest" for concrete reasons

- Status: accepted
- Date: 2026-07-02
- Scope: `repo`

## Context

The bootstrap says "latest stable" for Angular and names FluentAssertions. Both defaults are wrong for this environment or for a template, so they are chosen deliberately.

## Decision

**Angular pinned to 20 (not 22).** Angular CLI 22 requires Node `^24.15.0` in the 24.x line; the environment has Node `24.12.0`. Rather than upgrade the user's Node unattended (a system-wide change with broad blast radius), the template pins Angular 20, which supports Node `>=24.0`. Bump to 22+ once Node moves past 24.15.

**Assertions use Shouldly (not FluentAssertions).** FluentAssertions v8 moved to a commercial Xceed license: commercial use requires a paid per-seat license, and v7 is a frozen Apache-2.0 tail. Rather than pin a dead version, the tests use Shouldly (MIT, actively maintained). Both backend test projects assert with `x.ShouldBe(...)` and friends.

## Consequences

- A fresh clone on Node `24.12` builds the frontend without a Node upgrade.
- No clone inherits a paid or frozen test-assertion dependency.
- The Angular pin is a single-line bump when Node moves. This ADR is the record of why it is not "latest," so a future agent does not "helpfully" upgrade it without understanding the trade-off.
