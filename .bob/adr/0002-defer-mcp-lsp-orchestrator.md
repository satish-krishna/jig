# ADR 0002 — Defer the MCP LSP orchestrator until a real refactor needs it

- Status: accepted
- Date: 2026-07-02
- Scope: `tools`

## Context

The bootstrap prompt (section 6.3) lists an MCP LSP orchestrator (e.g. agent-lsp) exposing blast-radius and speculative-edit tools as an "optional power-up." YAGNI says build only what the current work proves. The discovery gate the template actually needs — "find what exists before building" — is served today by native Claude Code LSP (rust-analyzer and typescript-language-server via `/plugin`) plus csharp-ls via `.lsp.json`.

## Decision

Ship `.mcp.json` with an empty `mcpServers` map. Do not wire an MCP LSP orchestrator now.

## Consequences

- `workspace/symbol`, find-references, and hover — everything the discovery gate requires — work through the native LSP integration without an extra server.
- Add the orchestrator when a concrete need appears: a large cross-cutting refactor, or a "what breaks if I change this signature" question that native find-references answers too slowly. At that point add the server to `.mcp.json` and document the trigger in CLAUDE.md. Adding it before then is speculative machinery with one hypothetical caller.
