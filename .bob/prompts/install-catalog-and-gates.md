# Prompt: install a capability catalog + green-gate into an existing repo

Paste this entire file to an agent running inside the target repository. It ports Jig's two load-bearing habits — a generated capability catalog and a machine-enforced green gate — adapted to whatever stack that repo already uses. It does not copy Jig's files; it rebuilds the pattern in the target's own language and tooling.

---

## Task

You are working inside an existing repository that predates this system. Add a capability catalog, a green gate with hard local hooks, and one short usage doctrine — all adapted to THIS repo's stack, not copied verbatim from anywhere.

## Non-negotiable constraints (read first, they override your instincts)

1. **KISS.** Every script you write must be readable by a tired human at 3AM. Straight-line code, obvious names, no clever regex, no metaprogramming, no frameworks. If a junior cannot explain it on first read, rewrite it simpler. Boring is the goal.
2. **Tooling language is `.mjs` on node/bun. Never Python** — not even if this repo is a Python project. The catalog tool is a node/bun script that *reads* the repo's source; it is not written in the repo's language. Use `.ts` ONLY if the repo already runs TS scripts (bun present, or node >= 22). Otherwise `.mjs`.
3. **Discover, don't assume.** Do Phase 0 fully and REPORT before you mutate anything.
4. **Idempotent and non-destructive.** Safe to run twice. Never clobber existing config, hooks, or CI — merge or append and report any conflict instead.

## Phase 0 — Discover this repo (report, then stop for confirmation)

Find and report, concisely:

- Primary language(s) and their doc-comment syntax (`///` Rust, `/** */` JS/TS, `"""..."""` Python, `//` Go, etc.).
- Package manager / task runner, and the REAL commands for lint, typecheck, build, and test. List only ones that actually exist. Say "none" where none exists — do not invent.
- Whether `bun` or node >= 22 is available (this decides `.ts` vs `.mjs`).
- Existing CI (`.github/workflows`, `.gitlab-ci.yml`, etc.) — yes/no and where.
- Existing git hooks (`.git/hooks`, `core.hooksPath`, husky, lefthook) — yes/no.
- Whether the repo already uses conventional commits and/or feature branches (skim recent git log and branch names).
- The source directories worth cataloging (top-level app/lib dirs, not vendored dependencies).

Print this as a short findings list, then WAIT for go-ahead before Phase 1 onward.

## Phase 1 — Capability catalog

Create a single catalog generator script (`.mjs` or `.ts` per the rule above), e.g. `tools/catalog.mjs`. It must:

- Walk the source dirs found in Phase 0 (skip vendored, build, and dependency dirs).
- Parse **capability annotations** written in the target language's doc-comment syntax. The schema is exactly three fields:
  - `@capability <area>.<name>` — required. The key, e.g. `auth.token-store`.
  - `@intent <one line>` — required. Why this exists / the rule it enforces.
  - `@reuse <one line>` — required. How to reuse it / what not to do.
- The symbol name is the first declared identifier on the code line after the block.
- Emit two files into a `.catalog/` dir (or the repo's docs dir if it has an obvious one):
  - `catalog.json` — machine index.
  - `CATALOG.md` — human/agent view, grouped by `<area>`, each entry showing intent, reuse, and file path. The header must state it is GENERATED — do not hand-edit.
- Support a `--check` flag: regenerate in memory, compare to the files on disk, and **exit non-zero if they differ** ("catalog is stale — regenerate and commit"). This drift check is the whole point; it is what makes the catalog trustworthy.

KEEP THE PARSER SIMPLE: read the file lines; when a line's comment contains `@capability`, collect the tagged lines until the comment block ends, then grab the next identifier. Line-by-line and dumb beats a clever regex. No AST, no parser library. Add script aliases so the runner regenerates (`catalog`) and checks (`catalog:check`).

### Deliberately NOT in the schema

Do not add these, no matter how useful they look:

- `@since <version>` — decoration. Only earns its place in a repo with real release discipline, which this one does not have.
- `@usedby` / dependency lists — a hand-written fact the code already owns. It rots silently: it goes stale whenever a *different* file changes, which the author never touches, and the `--check` drift gate cannot see the rot because it only reads the annotation text. "Who uses this" is answered live and correctly by find-references / LSP / grep. Never hand-maintain it.

The one relationship pointer that is rot-safe, if the repo later misses it, is `@example <path>` — a single hand-picked exemplar the generator can validate by checking the path exists. Ship without it; add it only when a real need appears.

## Phase 2 — The green gate (`verify`)

Create `tools/verify.mjs` (or `.ts`). It runs, IN ORDER, stopping at the first failure and naming it:

1. catalog freshness (`catalog --check`) — always first, it is fast.
2. then each REAL check discovered in Phase 0 that exists: lint, then typecheck, then build, then test.

Skip steps that do not exist and print that they were skipped — never fabricate a passing step. If the repo has no tests at all, the gate still enforces catalog freshness plus whatever does exist, and you report honestly which quality bars are and are not covered. Add a `verify` script alias.

## Phase 3 — Local hooks (HARD gate — this is deliberate)

Wire hooks via `core.hooksPath = .githooks` (portable, no husky/lefthook dependency). If a hook framework is already present, integrate with it instead of fighting it.

- `.githooks/pre-commit` (POSIX `sh`, hard `exit 1` on failure):
  - Refuse commits directly on `main`/`master` (allow an escape-hatch env var for the initial setup commit).
  - Enforce branch naming `<type>[(scope)]/<kebab>` where type is one of feat, fix, docs, refactor, test, chore, build, ci, perf, style, revert.
  - Run catalog `--check` and any fast tooling checks. Hard-fail on stale.
- `.githooks/commit-msg`: enforce Conventional Commits. Derive the allowed scopes from the catalog `<area>` values / top-level dirs; if the repo has no clean areas, make scope optional rather than inventing noise.

These block locally, by design. Make every failure message tell the human exactly how to fix it — the branch command to run, the command to refresh the catalog.

## Phase 4 — CI (per-repo, ASK — do not assume)

- If the repo ALREADY has CI: add or extend a job that runs `verify` on push and PR. Match the existing CI platform and style.
- If the repo has NO CI: do NOT create one silently. Propose a minimal workflow that runs `verify`, show it, and let the human decide per repo. Some of these repos are not ready for CI and that is fine — a hard local gate is the floor.

## Phase 5 — Usage doctrine (short)

Write a brief section into the repo's existing agent/contributor doc (`AGENTS.md`, `CONTRIBUTING.md`, or `CLAUDE.md` — whichever exists; create `CONTRIBUTING.md` if none). Adapt, do not copy another project's constitution. Cover only:

- **Discover before you build:** before writing a reusable unit, read `CATALOG.md` and reuse or extend a match instead of adding a parallel one.
- Where the catalog lives, how to annotate a symbol (the three-field block), and the command to regenerate.
- The gate: `verify` is the green bar; commit on green; the hooks enforce it locally.

## Done when

Run the catalog generator and `verify` yourself and paste the output proving both are green. Then report: what got installed, what is gated vs. skipped (and why), whether CI was added or deferred, and any existing config you had to merge around.
