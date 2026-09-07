# ADR 0012 — Frontend design and MVVM rules are lint errors

- Status: accepted
- Date: 2026-09-07
- Scope: frontend/src/app, frontend/eslint.config.mjs, frontend/stylelint.config.mjs, tools/lint, tools/hooks. Explicitly not in scope: frontend/libs/ui (generated, ADR 0010) and the .NET layer rules (ADR 0009).
- Amends: ADR 0009, whose "Scope is the .NET API only" line is superseded by this record.

## Context

ADR 0009 made the .NET layer rules compiler errors and argued the general case: a rule with a suppression dial will eventually be suppressed and cannot report that it was. It then limited itself to the API, and the frontend kept its rules in prose — `docs/architecture/design.md`, `docs/architecture/forms.md`, and the MVVM boundary described in the `users` slice.

An audit found seven of `design.md`'s eleven "non-negotiable" claims false, self-contradictory, or true only by an inheritance the document never named. Not because anyone was careless: the app was built correctly against most of that design language by care alone. But care does not survive cloning, and this repo is a fixture others clone. The gate does.

The frontend's failure modes are also not the ones a compiler catches. A component that owns screen state instead of delegating to a ViewModel compiles. A `<button>` with no primitive compiles and renders unstyled. A `gap-2` where the scale says `gap-m` compiles, and Tailwind resolves it happily. Every one of those is invisible to `tsc` and to the Angular AOT build.

## Decision

The frontend design language and the MVVM boundary are enforced by ESLint and stylelint, at `error`, inside `npm run verify`. Twenty-six rules live in `tools/lint/rules/`, each with a document at `docs/architecture/rules/<rule-name>.md` that its own error message names.

### Why a tool with a suppression dial, when ADR 0009 refused one

This is the question ADR 0009 forces, and it has to be answered rather than skipped. ESLint ships `eslint-disable`. Stylelint ships `stylelint-disable`. Both are exactly the dial ADR 0009 spent three pages refusing to build, and there is no Roslyn-equivalent for Angular templates worth waiting for.

The dial is closed in three places, not one:

1. **`linterOptions.noInlineConfig: true`** in `frontend/eslint.config.mjs`. An `eslint-disable` comment is inert — it still looks like it works, which is worse than an error, so this ADR is where that is written down.
2. **`--ignore-disables`** on stylelint, applied inside `tools/lint/stylelint-frontend.ts`, which is the single definition both `npm run stylelint` and the tests call. This one was found missing by the final review of the branch that built all this: `/* stylelint-disable */` took the gate from exit 2 to exit 0 while ESLint's half had held shut from the start. The spec claimed the two mirrored. They did not, and nothing checked.
3. **A PreToolUse guard** (`tools/hooks/guard-ruleset.ts`) denying agent edits to both config files, on the same asymmetry ADR 0009 draws for the analyzer: gutting a rule turns its own test red, so it already has a backstop; deleting a line from a config is silent.

What none of that closes is the same door ADR 0009 named: an agent can still delete a rule, widen a glob, or unregister a hook. Three meta-tests make each loud — every rule must be registered, documented, exercised through `RuleTester`, and enabled at error, and both `files` and `ignores` globs are pinned. What catches the rest is the diff, read by someone who treats a ruleset change as a law change, and CI running the same rules from a clean checkout where no hook exists.

### What is deliberately NOT enforced

Two boundaries are documented rather than closed, because closing either would cost more than it buys:

- **`no-component-subscribe` covers components, not ViewModels.** `Transport.request()` returns an Observable, so every ViewModel must subscribe or convert; making the rule satisfiable means changing the transport seam. The cheap fake — swapping `.subscribe()` for `firstValueFrom` — passes the rule and changes nothing architecturally, so the rule's document forbids it by name. It extends to ViewModels when the transport returns Promises.
- **The route-boot check owns boot-time failure only.** `frontend/e2e/routes.boot.spec.ts` catches a constructor injecting something unprovided, a throwing `ngOnInit`, a `computed()` that throws during render, and a failing child constructor — all four prevent the outlet marker from rendering. An error thrown after a successful render is outside its reach. Closing that needs a fixed wait after render, which is the flaky-sleep pattern four unit specs were just rid of.

## Consequences

- The design language is checkable from a clean clone by someone who has read none of this.
- `npm run lint` and `npm run stylelint` join the green gate; `npm run verify:frontend` runs the same gate without .NET and Rust for the inner loop, and prints a different sentence so it can never be mistaken for the full run.
- A new rule costs a rule file, a `RuleTester` test, a document and a registration. That is deliberate friction: a rule nobody can find the reasoning for is a rule the next maintainer deletes.
- The rules are computable ones only, the same limit ADR 0009 sets. "This component owns state it should delegate" has an exit code. "This abstraction is wrong" does not, and stays with review.
