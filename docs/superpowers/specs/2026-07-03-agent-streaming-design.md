# Jig agent streaming — design

- Date: 2026-07-03
- Status: design (implementation deferred; depends on the Kata schema enhancement)
- Scope: `transport`, `contracts`, `api`, `shell`, frontend chat feature

## Goal

Make "AI chat" a first-class, reusable capability of the Jig template, working over **both** wires: the desktop (thick) build talks to a local `claude -p` agent via Kata over IPC; the web (thin) build talks to a server-side agent (built on the Microsoft Agent Framework) over HTTP/SSE. One frontend, two providers, and the frontend never learns which is behind it.

The experience is **agent-task interaction** (Kata-style), not token-streaming chat: start a task, watch a coarse event stream (narration, tool calls), answer the agent's questions inline, see it complete. Token streaming and the AG-UI protocol are explicitly out of scope (see Non-goals).

## The contract

The wire-crossing contract is **Kata's normalized event protocol** (`KataEvent`): four families already emitted by Kata today —

- **Lifecycle:** `run.started`, `run.completed`, `run.error`, `run.cancelled`, `run.diff`, `turn`.
- **Narration:** `assistant.text`, `log`.
- **Tool calls:** `tool.use`, `tool.result`.
- **Interaction:** `ask.requested` (blocking), `ask.answered`.

Both providers emit this exact protocol; the answer back-channel is `answer <id> <json>` where `<json>` is `{ answers: string[][] }`, correlated to an `ask.requested` id.

Types are **generated, not hand-written**: Jig codegens TypeScript `AgentEvent` types from the JSON Schema Kata publishes (see the companion Kata spec). This gives the streaming side the same no-drift guarantee the request/response side gets from OpenAPI. **Hard dependency:** this feature cannot start until Kata publishes that schema.

## Architecture

The streaming path is a **second Conduit seam, parallel to the request/response `Transport`** — a long-lived bidirectional event stream is a different shape than one-shot req/res, so it is its own port, not a method on the existing one.

```mermaid
flowchart TD
    UI["Chat feature: narration, tool rows, ask -> SchemaForm"] --> Sess["AgentSession (event-stream port)"]
    Sess -. "isTauri() at bootstrap" .-> IpcS["IpcAgentTransport"]
    Sess -.-> SseS["HttpAgentTransport (SSE + POST answers)"]
    IpcS --> Rust["Rust core: spawn + bridge kata"]
    SseS --> Net[".NET AIAgent (Agent Framework)"]
    Rust --> Kata["kata -> claude -p (local)"]
    Net --> Anthropic["Claude via Agent Framework (Anthropic connector)"]
```

## Components

**Frontend (`frontend/src/app/`):**
- `contracts/generated/agent-events.ts` — generated `AgentEvent` union from Kata's schema.
- `agent/agent-session.port.ts` — abstract `AgentSession`: `start(spec): Observable<AgentEvent>` and `answer(id, answers): void`. The only place that knows two providers exist.
- `agent/ipc-agent.transport.ts` — subscribes to Tauri IPC events, sends answers over IPC.
- `agent/http-agent.transport.ts` — consumes SSE, POSTs answers.
- `agent/provide-agent-session.ts` — picks the provider at bootstrap with `isTauri()`, wrapped in a normalizer (one place for reconnect/error shaping), mirroring `provideTransport`.
- `features/chat/` — the chat view: renders narration and tool rows from the event stream; on `ask.requested`, adapts the `Question[]` to a zod schema + `FormFieldMeta` and renders it through the existing **`SchemaForm`** (this is the generative-UI payoff), then adapts the form result back to Kata's `answers` matrix.

**Desktop provider (`apps/desktop/src-tauri`):** a thin bridge — spawn `kata`, read its stdout JSON-lines, forward each as a typed Tauri IPC event; write `answer <id> <json>` to Kata's stdin. No agent logic; Kata owns it.

**Web provider (`services/api`):** a **`Microsoft.Agents.AI` `AIAgent`** (Microsoft Agent Framework — the Semantic Kernel + AutoGen successor). The framework owns the agent loop, tool execution, and streaming, so the provider's job shrinks to three things:

1. **Configure the agent against a model connector.** Use the framework's **Anthropic connector so the web agent runs Claude**, matching the desktop's `claude -p` and keeping behavior parity across wires — the two wires differ only in transport, not model.
2. **Map the framework's streaming run updates to `KataEvent`** — assistant text → `assistant.text`, function calls → `tool.use` / `tool.result`, completion → `run.completed`. Framework **middleware** is the clean interception point for this.
3. **Register `ask_user` as a function tool**, backed by the framework's human-in-the-loop / session state: when the agent calls it, emit `ask.requested`, block, and resolve on a POSTed answer correlated by id. (If a bare agent's tool-blocking is insufficient for a durable pause, implement this leg as an Agent Framework **Workflow** with a HITL step — its state management is built for exactly this.)

It emits the **same** `KataEvent` protocol, so the frontend cannot tell it apart from Kata.

**Codegen (`tools/codegen`):** extend the pipeline to fetch Kata's published JSON Schema and generate the TS `AgentEvent` types (and, for the web loop, C# types).

## The three asymmetries (design for them at the seam)

1. **Provider selection** happens once, at bootstrap, via `isTauri()`. Nowhere above it.
2. **Credentials.** Desktop runs the user's own local `claude` with their credentials on their machine. Web runs a server-side loop with a service API key. Auth lives on the web side only, exactly like the request/response Conduit rule.
3. **Ask correlation.** Desktop answers travel Kata's stdin back-channel (process-local). Web answers are a separate POST correlated by `ask` id to a server-held session. Both resolve the same `ask.requested`; the frontend sees one `answer(id, …)` call.

## Error handling

`run.error` / `run.cancelled` carry an exit code and surface as a terminal chat state. Stream disconnects (SSE drop, IPC channel close, Kata process exit) fold into one `AgentError` at the normalizer, never reaching the chat view raw. Answer deadlines (Kata exit 123) render as a timed-out ask.

## Testing

- **Chat feature:** a fake `AgentSession` that emits a scripted `AgentEvent[]`; assert narration/tool rows render and that an `ask.requested` renders through `SchemaForm` and produces the right `answers` matrix. No real agent.
- **Desktop bridge:** feed canned Kata stdout lines; assert IPC events out and stdin answers in.
- **Web provider:** run the `AIAgent` against the framework's test/fake chat client; assert the middleware maps run updates to the `KataEvent` protocol and that the `ask_user` function tool blocks and resolves on a POSTed answer.

## Sequencing

1. **Upstream (Kata, separate session):** publish the schema (companion spec).
2. **Contract + codegen:** generate `AgentEvent` types in Jig.
3. **Web provider** (thin client — configure the `AIAgent` with the Anthropic connector, map its updates to `KataEvent` via middleware, wire the `ask_user` HITL tool). The framework removes the from-scratch runtime, but this is still the most substantive new piece.
4. **Desktop bridge.**
5. **Chat feature + ask→SchemaForm adapter.**

## Non-goals

- Token-streaming chat and live token deltas.
- The AG-UI protocol (Kata's coarse protocol already carries tool calls, which was AG-UI's only draw here).
- Generative UI beyond adapting `ask.requested` through `SchemaForm`.
- Multi-agent orchestration.

## Open risks

- The Microsoft Agent Framework removes the from-scratch agent runtime, but the web provider still owns the event mapping (framework updates → `KataEvent`) and the human-in-the-loop `ask` correlation, plus per-session state and concurrency. It is still the effort center of gravity. The framework is prerelease (`Microsoft.Agents.AI.* --prerelease`); confirm its streaming-update, middleware, and HITL APIs at implementation time.
- Kata's `tool.result` currently lacks the tool name (correlation TODO); tool rows render better once the companion Kata spec fixes it.
