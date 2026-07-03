# Kata event-protocol schema — enhancement design

- Date: 2026-07-03
- Status: design (implementation deferred to a separate Kata session)
- Repo: **this spec targets the Kata repo** (`crates/kata-core`, `app/`); authored from the Jig session and staged here for relocation. Do not implement in Kata yet.

## Goal

Lift Kata's event protocol from hand-maintained Rust structs into a **single-source-of-truth schema**, and generate every consumer's types from it. This cures Kata's existing internal drift and makes Kata a publishable contract that downstream apps (Jig, and its .NET web agent loop) can generate from instead of hand-copying.

This is **not a feature add.** The event families are already complete (`assistant.text`, `tool.use`/`tool.result`, `ask.requested`/`ask.answered`, and the full run lifecycle in `KataEvent`). The gap is that the shape lives only in `crates/kata-core/src/event.rs`, and `app/src/lib/events.ts` mirrors it **by hand** (the code says so at the `Question` doc comment: "events are not ts-rs exported"). Two hand-kept copies already; a third consumer (Jig) is coming.

## The core change: publish a schema

1. **Derive a schema from the source of truth.** Add `schemars::JsonSchema` (or `ts-rs`, evaluated below) to `KataEvent` and its payload types — `Question`, `QuestionKind`, `QuestionOption`, `DiffFile`. Keep serde's existing `#[serde(tag = "type", rename = "run.started" …)]` tagging so the schema matches the wire exactly.
2. **Emit the schema as an artifact.** A `kata schema` subcommand (or a build step) writes a versioned `schema/kata-events.schema.json`, committed to the repo. Prefer a committed artifact plus a CI freshness check (regenerate and diff — the same guarantee Jig uses for its capability catalog), so the schema can never silently fall out of sync with the enum.
3. **Version the protocol.** Stamp a `protocolVersion` in the schema/artifact so consumers can pin and detect breaks.
4. **Retire the hand-mirror.** Generate `app/src/lib/events.ts` from the schema and delete the hand-written copy. This is the proof the schema works: Kata's own app consumes it first.

### `schemars` vs `ts-rs`

- **`ts-rs`** emits TypeScript directly — good for Kata's own Svelte app, but TypeScript-only, so Jig's .NET web loop can't consume it.
- **`schemars`** emits a JSON Schema — language-neutral, so TS (Kata app, Jig frontend) and C# (the .NET loop) all generate from one artifact.

Recommendation: **`schemars`**, because the whole point is a cross-language contract. Generate TS from the JSON Schema with `json-schema-to-typescript` (or `openapi-typescript`-style tooling) on both the Kata and Jig sides.

## Optional item 1: a `notify` MCP tool (probably not needed for v1)

Today `assistant.text` already relays the model's own output — the "message displayed on the UI" need is met. A `notify` tool would only add value if the agent should **curate** what the user sees, distinct from its full narration. Ship v1 on `assistant.text`; add `notify` (a non-blocking sibling of `ask_user`, emitting a new `message` event) only if raw assistant text proves too noisy in practice. Marked optional so it does not gate the schema work.

## Optional item 2: `tool.result` correlation (small, worth it)

`parse_stream_line` sets `ToolResult.name` to an empty string — the code's TODO notes that Claude's `tool_result` carries a `tool_use_id`, not the tool name. Correlate the `tool_use_id` back to the originating `tool.use` so results render with their tool. This is independent of the schema work but improves any consumer's tool display, including Jig's chat feature.

## Consumers of the published schema

- **Kata's own `app/`** (generated `events.ts`, hand-mirror retired) — the first consumer, and the regression guard.
- **Jig frontend** (`AgentEvent` TS types).
- **Jig's .NET web agent loop** (C# types), which must emit this exact protocol.

## Testing

- Keep the existing `event.rs` serde round-trip tests unchanged — they already pin the wire shapes.
- Add a test/CI check that the committed `schema/kata-events.schema.json` matches the current enum (regenerate-and-diff).
- Add a round-trip through the generated TS types for a representative event of each family.

## Non-goals

- No new event families (they exist).
- No protocol redesign or renaming of existing events (would break Kata's own app and any consumer).
- No token-level streaming events — Kata's protocol stays coarse by design.

## Sequencing note

This unblocks the Jig agent-streaming feature (companion spec `2026-07-03-agent-streaming-design.md`), which cannot begin its codegen until this schema exists. Do this first, in its own Kata session.
