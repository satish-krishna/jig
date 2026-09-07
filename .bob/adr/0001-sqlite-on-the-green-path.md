# ADR 0001 — SQLite is on the default green path; Testcontainers/Postgres is the production swap

- Status: accepted
- Date: 2026-07-02
- Scope: `api`, `tools`

## Context

Phase 6's gate requires that a fresh clone "reaches green from the setup script alone." The tech-stack table names Testcontainers "for anything stateful." Testcontainers needs a running Docker daemon. If the default test path required Docker, a Docker-less clone (a common state on a fresh machine or a locked-down CI runner) would fail the Phase 6 gate through no fault of the code.

## Decision

- The application persists via **EF Core with the SQLite provider**.
- Backend **integration tests run against SQLite in-memory** through the FastEndpoints test host. This is the default `dotnet test` path and needs no Docker.
- **Testcontainers + Postgres remains available and documented** as the production-parity swap for provider-specific behavior, but it is not on the default green path and not required by any gate.

## Consequences

- A fresh clone reaches green with only the SDKs the setup script checks for — no Docker prerequisite.
- SQLite and Postgres differ (case sensitivity, some SQL, concurrency). Tests that must assert Postgres-specific behavior opt into the Testcontainers path explicitly; the template does not pretend SQLite proves Postgres.
- Provider choice lives behind EF Core configuration, so a clone that wants Postgres by default changes one registration, not the tests.
