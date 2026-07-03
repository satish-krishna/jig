# ADR 0004 — Two dependency versions are pinned below "latest" for concrete reasons

- Status: accepted
- Date: 2026-07-02
- Scope: `repo`

## Context

The bootstrap says "latest stable" for Angular and names FluentAssertions. Two of those defaults are wrong for this environment or for a template, so they are pinned deliberately.

## Decision

**Angular pinned to 20 (not 22).** Angular CLI 22 requires Node `^24.15.0` in the 24.x line; the environment has Node `24.12.0`. Rather than upgrade the user's Node unattended (a system-wide change with broad blast radius), the template pins Angular 20, which supports Node `>=24.0`. Bump to 22+ once Node moves past 24.15.

**FluentAssertions pinned to 7.2.2 (not 8.x).** FluentAssertions v8 moved to a commercial Xceed license: commercial use requires a paid per-seat license. A template is cloned to build commercial apps, so defaulting to v8 would silently impose a licensing cost on every clone. v7.2.2 is the last Apache-2.0 release and exposes the same assertion API. A clone that wants v8 (or the MIT fork AwesomeAssertions) can swap it in one line.

## Consequences

- A fresh clone on Node `24.12` builds the frontend without a Node upgrade.
- No clone inherits a paid test-assertion dependency by default.
- Both pins are single-line bumps when the constraint changes. This ADR is the record of why they are not "latest," so a future agent does not "helpfully" upgrade them without understanding the trade-off.
