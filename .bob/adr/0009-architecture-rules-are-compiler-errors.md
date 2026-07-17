# ADR 0009 — Architecture rules are compiler errors, not conventions

- Status: accepted
- Date: 2026-07-17
- Scope: services/api, tools/analyzers

## Context

The .NET slice has the shape we want: `IUserRepository` is the persistence port the use-case layer owns, `UserRepository` is the only EF Core adapter, and endpoints inject `UserService` and nothing else. Until now the rule holding that shape lived entirely in prose — C# doc comments and the catalog generated from them ("the application never sees a DbContext", "it speaks IUserRepository, never EF Core directly"). It appeared in no ADR, no gate, and no test.

An unenforced rule and an enforced rule are different objects. This one had no test, no analyzer, no `.editorconfig`, and no hook behind it. Its only structural backstop was `Jig.Application.csproj` carrying no EF Core reference — which protects the Application layer and leaves `Jig.Api` open, since it references `Jig.Infrastructure` directly for `AddInfrastructure` and `InitializeDatabaseAsync`. `JigDbContext` was type-reachable from endpoint code, held back by convention.

CLAUDE.md already commits the template to machine-checked gates over "please remember", and calls the non-negotiables gates rather than preferences. A layering rule carried only by doc comments failed that standard. In a template the cost compounds: the hole replicates into every clone.

The obvious enforcement — grep the `.csproj` files for a forbidden `ProjectReference` — does not work, and its failure is the reason this ADR exists. Layer dependency is a property of a graph, not of a file. .NET flows transitive project references straight through: `Domain -> Common -> Infrastructure` puts an infrastructure type in scope in the domain while every file a grep reads is innocent. A check like that inspects the paperwork and the paperwork is always in order.

The mechanics live in the design spec at `docs/superpowers/specs/2026-07-17-roslyn-architecture-analyzers-design.md`. That spec is the right home for the wiring and the wrong home for the principle: it is dated scaffolding, and `tools/init/init.mjs` deletes `docs/superpowers` outright when the template is cloned. Without a standing rule here, the clone inherits the analyzer and no statement of why it may not be reasoned around.

## Decision

- **Layer rules are enforced by a Roslyn analyzer, not by tests, scripts, or review.** `Jig.Analyzers` binds each syntax node through the semantic model and matches its resolved containing namespace against a layer map. The compiler has already built the dependency graph; we read it rather than reconstruct it. An architecture-test library (NetArchTest, ArchUnitNET) is rejected: it rebuilds the solution the gate just built and starts a test host to recover a graph Roslyn already handed us. An analyzer is not a test — it is part of the compilation, so there is no runner to skip.

- **The layer map is data, in `tools/analyzers/Jig.Analyzers/ArchLayers.txt`, wildcarded on the product prefix.** Rules read `*.Application -> *.Infrastructure`. Layer names are structural; the product name is not. Adding a layer is a line, not a recompile, and the ruleset is correct in every clone with no rename step — it is not coupled to `init`'s file selection.

- **The rules cannot be configured off.** Both diagnostics ship `defaultSeverity: Error` with `customTags: WellKnownDiagnosticTags.NotConfigurable`. `.editorconfig` severity, `<NoWarn>`, and `#pragma warning disable` all fail to suppress them. A dial you can turn up is a dial you can turn down, and a rule that has been switched off cannot report that it has been switched off. The cost is accepted deliberately: no per-case suppression and no gradual adoption. These are rules we would rather fail the build than argue about, and that is the only kind of rule that belongs in this analyzer.

- **The analyzer is wired in `services/api/Directory.Build.props`, never in a `.csproj`.** A `ProjectReference` in a project file is five lines of XML anyone can delete to switch off every rule at once, and a guard that blocks `.csproj` edits is a guard that gets disabled by lunchtime. Wiring rules into files that are routinely edited is the defect; the props floor removes the thing there is to delete.

- **The analyzer fails the build when its own ruleset is empty (DR0002).** Zero parsed rules is a compilation error, not a green build. A check that reports success because it found nothing to check is the failure mode this whole decision exists to prevent — absence of complaint is not innocence. This closes the deletion door from inside the compiler, where no hook can reach: `PreToolUse` matches `Write` and `Edit`, and deletion is neither.

- **`Jig.Analyzers.Tests` belongs to `services/api/Jig.sln`.** `verify` runs the tests in that solution. A test project outside it would never run in `verify`, in CI, or at `init`, and the fixtures proving DR0001 can fail would prove nothing. The tests that demonstrate a rule can fire are part of the rule.

- **The rule is scoped to `*.Api.Endpoints`, not `*.Api`, and there is no exemption mechanism.** `Program.cs` is the composition root and must touch Infrastructure. Rather than a skip-list or a `[CompositionRoot]` attribute — an exemption is a switch, and a switch gets thrown — the rule simply does not name the namespace `Program.cs` lives in.

## Consequences

- The rule that was prose is now a compile error with a line, a column, and a message written to be read by a model: `'Jig.Api.Endpoints' must not depend on 'Jig.Infrastructure': the type 'JigDbContext' lives there.` It costs nothing worth measuring, because it rides a build we already pay for.

- Every clone inherits enforcement, not a setup step. `tools/analyzers/`, `Directory.Build.props`, and `.claude/settings.json` all survive `init`; `docs/superpowers` does not. This ADR is the artifact that reaches the clone.

- **`NotConfigurable` has no escape hatch, by design.** A legitimate exception cannot be suppressed — it must be resolved by changing the code or by changing `ArchLayers.txt` in a diff someone reads. If a rule here starts generating exceptions that are actually legitimate, that is evidence the rule is wrong, and it should be removed rather than dialed down.

- **Known holes, accepted and recorded rather than discovered later.** Deleting `Directory.Build.props` or `tools/analyzers/` unloads the analyzer, and DR0002 cannot fire from a compilation it never joined — the build goes green. A type placed directly in `Jig.Api` rather than `Jig.Api.Endpoints` is outside the rule; a namespace convention holds that line and nothing else does. `Jig.Api.csproj` still references `Jig.Infrastructure`, so we ban the use and not the reachability.

- **Those last doors are not closeable from inside the repo, and the design does not pretend otherwise.** Every guard here has an off switch here; all we choose is how loud the switch is. What catches the rest is the diff, read by someone who treats a ruleset change as a law change, and CI running the same rules from a clean checkout where the agent's hooks do not exist. The hooks are for speed. The review is for trust.

- **This analyzer takes computable rules only.** "The Application layer must not reference Infrastructure" has an exit code. "This service has become a god object" does not, and neither does "this abstraction is wrong." Those stay with review. The rules with teeth are the ones that are cheap to be wrong about; the things that would genuinely embarrass us in review sit in the pile with no exit code, and determinism does not creep upward into that pile over time.

- Scope is the .NET API only. The Conduit transport seam, the Angular repository layer, and the Rust core are unaffected and keep their own rules (`docs/architecture/conduit.md`).
