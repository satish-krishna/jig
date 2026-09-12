// The thin-client cut: turn the dual-wire template into a browser SPA that talks
// to the .NET API over HTTP, with the Tauri shell and the Rust core removed.
//
// Jig ships both clients — `apps/desktop/src-tauri/src/users.rs` holds the same
// use-cases the .NET API does, and `provideTransport` picks a wire at bootstrap.
// `node tools/init/init.ts <App> --thin` keeps only the HTTP half.
//
// Two mechanisms, split by whether a thing is removed or rewritten:
//
//   - What VANISHES is marked in place. A `thick:start` / `thick:end` block (HTML,
//     `//` or `#` comment leader) wraps a contiguous run — a doc section, the Rust
//     toolchain slots in setup, the CI toolchain steps — that has no meaning without
//     a Rust core. The marker lives next to what it describes, so anyone editing
//     that code sees it. Both cuts consume them: `--thin` drops the block, and the
//     thick default drops just the marker lines (see stripThickMarkers).
//   - What is REWRITTEN is patched by exact match. A sentence that loses a clause,
//     or `isTauri() ? 'ipc' : 'http'` collapsing to `'http'`, cannot be expressed as
//     a marked block without writing both variants side by side and letting them
//     drift. So each edit names the literal it replaces and THROWS when that literal
//     is missing or ambiguous. That throw is the point: `thin.test.ts` runs every
//     patch against the real file, so a refactor that moves an anchor fails at
//     `npm run test:tools` — in the pre-commit hook — rather than in a stranger's
//     fresh clone months later.
//
// Kept pure so it is unit-tested without touching disk.

/** Paths deleted outright by the thin cut. Directories are removed recursively. */
export const THIN_DELETE: readonly string[] = [
  'apps',
  'frontend/src/app/transport/ipc.transport.ts',
  'frontend/src/app/transport/ipc.transport.spec.ts',
  // The conduit skill's entire subject is choosing between two wires. Trimming it
  // to one leaves 200 lines answering a question the app no longer has, so the thin
  // cut drops it whole and keeps `docs/architecture/conduit.md` as the seam doc.
  '.claude/skills/conduit',
];

/** The frontend dependency only the IPC wire needed. Uninstalled, so the lockfile stays honest. */
export const THIN_DROP_DEPENDENCY = '@tauri-apps/api';

/** One literal replacement. `find` must occur exactly once in the file. */
export type Edit = readonly [find: string, replace: string];

export interface Patch {
  path: string;
  edits: readonly Edit[];
}

export const THIN_PATCHES: readonly Patch[] = [
  // ---- the transport seam -------------------------------------------------
  {
    path: 'frontend/src/app/transport/provide-transport.ts',
    edits: [
      ["import { isTauri } from '@tauri-apps/api/core';\n", ''],
      ["import { IpcTransport } from './ipc.transport';\n", ''],
      [
        "export const WIRE = new InjectionToken<'ipc' | 'http'>('transport wire');",
        "export const WIRE = new InjectionToken<'http'>('transport wire');",
      ],
      [
        ` * Picks the wire once, at bootstrap: IPC under Tauri, HTTP in the browser, wrapped
 * in the normalizer so error shaping lives in exactly one place. This is the only
 * spot in the app allowed to ask isTauri().
 *
 * @capability transport.provide
 * @intent Collapse the whole "which world" decision to one factory at startup.`,
        ` * Wires the HTTP transport once, at bootstrap, wrapped in the normalizer so error
 * shaping lives in exactly one place.
 *
 * @capability transport.provide
 * @intent One factory owns the wire, so nothing above it constructs a transport.`,
      ],
      [
        `    HttpTransport,
    IpcTransport,
    { provide: API_BASE_URL, useValue: apiBaseUrl },
    { provide: WIRE, useValue: isTauri() ? 'ipc' : 'http' },
    {
      provide: Transport,
      useFactory: () => new NormalizingTransport(isTauri() ? inject(IpcTransport) : inject(HttpTransport)),
    },`,
        `    HttpTransport,
    { provide: API_BASE_URL, useValue: apiBaseUrl },
    { provide: WIRE, useValue: 'http' },
    {
      provide: Transport,
      useFactory: () => new NormalizingTransport(inject(HttpTransport)),
    },`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/transport/index.ts',
    edits: [["export { IpcTransport, INVOKE, type InvokeFn } from './ipc.transport';\n", '']],
  },
  {
    path: 'frontend/src/app/transport/transport.port.ts',
    edits: [
      [
        ` * The transport port: the only object in the frontend that knows two wires exist.
 * It speaks logical operations and returns Observables, so the HTTP world
 * (HttpClient) and the IPC world (invoke) look identical to every caller above it.
 *
 * @capability transport.port
 * @intent One abstract seam; View, ViewModel, and repositories never learn which wire is live.
 * @reuse Inject Transport (the DI token) and call request(op, payload). Never branch on wire above this.`,
        ` * The transport port: the only object in the frontend that knows a wire exists.
 * It speaks logical operations and returns Observables, so HttpClient never leaks
 * into any caller above it.
 *
 * @capability transport.port
 * @intent One abstract seam; View, ViewModel, and repositories never touch HttpClient.
 * @reuse Inject Transport (the DI token) and call request(op, payload). Never bypass it.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/transport/http.transport.ts',
    edits: [
      [
        '/** Base URL of the .NET API. Provided only in the web bootstrap; unused under Tauri. */',
        '/** Base URL of the .NET API. */',
      ],
      [
        ` * @intent The thin-client wire; route knowledge lives in the registry, not in callers.
 * @reuse Selected by provideTransport when not under Tauri. Do not call directly.`,
        ` * @intent The one wire; route knowledge lives in the registry, not in callers.
 * @reuse Provided by provideTransport. Inject the Transport port, not this class.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/transport/app-error.ts',
    edits: [
      [
        ` * Fold either wire's failure into one AppError. HttpClient throws HttpErrorResponse
 * with a status; a rejected invoke throws whatever the Rust command returned. This is
 * the single place that shape difference is resolved.`,
        ` * Fold a wire failure into one AppError. HttpClient throws HttpErrorResponse with a
 * status, a ProblemDetails body, or a bare network error, and this is the single
 * place those shapes are resolved.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/transport/app-error.spec.ts',
    edits: [
      [
        `  it('folds a raw invoke string rejection into an unexpected AppError', () => {
    const e = toAppError('users.get', 'boom from rust');
    expect(e.kind).toBe('unexpected');
    expect(e.message).toBe('boom from rust');`,
        `  it('folds a raw string rejection into an unexpected AppError', () => {
    const e = toAppError('users.get', 'boom from the api');
    expect(e.kind).toBe('unexpected');
    expect(e.message).toBe('boom from the api');`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/transport/normalizing.transport.spec.ts',
    edits: [
      [
        `  it('folds a raw invoke rejection into an AppError', async () => {
    const sut = new NormalizingTransport(new FakeTransport(() => throwError(() => 'rust exploded')));`,
        `  it('folds a raw string rejection into an AppError', async () => {
    const sut = new NormalizingTransport(new FakeTransport(() => throwError(() => 'the api exploded')));`,
      ],
      ["expect(err.message).toBe('rust exploded');", "expect(err.message).toBe('the api exploded');"],
    ],
  },

  // ---- contracts ----------------------------------------------------------
  {
    path: 'frontend/src/app/contracts/operations.ts',
    edits: [
      [
        ' * `npm run codegen`, so HTTP and IPC cannot disagree about a wire shape.',
        ' * `npm run codegen`, so the client and the API cannot disagree about a wire shape.',
      ],
      [
        ` * response shape crossing the transport seam. Both transports key off this map,
 * so TypeScript forces parity and the contract cannot drift.
 *
 * @capability contracts.operation-registry
 * @intent One typed map of operations so HTTP and IPC cannot disagree about a shape.`,
        ` * response shape crossing the transport seam. The transport keys off this map,
 * so TypeScript forces parity and the contract cannot drift.
 *
 * @capability contracts.operation-registry
 * @intent One typed map of operations so nothing hand-writes a wire shape.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/contracts/registry.ts',
    edits: [
      [
        ` * HTTP and IPC descriptors for every operation. The mapped types force every
 * OperationName to appear in both maps, so an operation added to the registry
 * cannot be forgotten on either wire: omit one and the build breaks.
 *
 * @capability contracts.transport-registry
 * @intent Compiler-enforced parity: every operation has both an HTTP route and an IPC command.
 * @reuse Add the operation to Operations, then its ROUTES and COMMANDS entry; omissions fail the build.`,
        ` * The HTTP descriptor for every operation. The mapped type forces every
 * OperationName to appear, so an operation added to the registry cannot be
 * forgotten on the wire: omit one and the build breaks.
 *
 * @capability contracts.transport-registry
 * @intent Compiler-enforced parity: every operation has a route.
 * @reuse Add the operation to Operations, then its ROUTES entry; omissions fail the build.`,
      ],
      [
        `
/** The Tauri command name each operation invokes on the IPC wire. */
export const COMMANDS: { [K in OperationName]: string } = {
  'users.list': 'users_list',
  'users.get': 'users_get',
  'users.save': 'users_save',
};
`,
        '',
      ],
    ],
  },

  // ---- app wiring, repositories, views ------------------------------------
  {
    path: 'frontend/src/app/app.config.ts',
    edits: [
      [
        `// The web build talks to the .NET API here; under Tauri the IPC wire is chosen
// instead and this base URL is unused. Point it at your API for the browser build.`,
        '// Where the app talks to the .NET API. Point it at your own deployment.',
      ],
    ],
  },
  {
    path: 'frontend/src/app/repositories/user.repository.ts',
    edits: [
      [
        ` * The user repository: speaks operations, never URLs or command names. Identical
 * across both wires because it only ever talks to the Transport port.
 *
 * @capability repositories.user
 * @intent Domain-facing user data access that is oblivious to HTTP vs IPC.`,
        ` * The user repository: speaks operations, never URLs. It only ever talks to the
 * Transport port, so route knowledge stays in the registry.
 *
 * @capability repositories.user
 * @intent Domain-facing user data access that is oblivious to the wire.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/features/users/user-list.view-model.ts',
    edits: [
      [
        ` * operations, so this class is identical whether the wire is IPC or HTTP.`,
        ` * operations, so this class never learns how a request reaches the API.`,
      ],
    ],
  },
  {
    path: 'frontend/src/app/showcase/pages/schema-form.page.ts',
    edits: [
      [
        "  stacks: z.array(z.enum(['angular', 'dotnet', 'rust'])).meta({",
        "  stacks: z.array(z.enum(['angular', 'dotnet', 'typescript'])).meta({",
      ],
      [
        "stacks: z.array(z.enum(['angular', 'dotnet', 'rust']))\n  .meta(",
        "stacks: z.array(z.enum(['angular', 'dotnet', 'typescript']))\n  .meta(",
      ],
    ],
  },
  {
    path: 'frontend/e2e/users.smoke.spec.ts',
    edits: [
      [
        '// same build serves this over HTTP in the browser and over IPC under Tauri.',
        '// build serves this over HTTP against the .NET API.',
      ],
    ],
  },
  {
    path: 'frontend/e2e/shell.layout.spec.ts',
    edits: [
      [
        `// resized to) and 1280 (a typical desktop width). No 375: Jig is a Tauri
// desktop app, not a phone target, and a responsive auditor that goes flaky on`,
        `// resized to) and 1280 (a typical desktop width). No 375: Jig is a desktop-width
// workspace app, not a phone target, and a responsive auditor that goes flaky on`,
      ],
    ],
  },

  // ---- backend ------------------------------------------------------------
  {
    path: 'services/api/src/Jig.Api/Users/UserContracts.cs',
    edits: [
      [
        '/// the frontend generates its TypeScript type from, so HTTP and IPC cannot disagree about it.</summary>',
        '/// the frontend generates its TypeScript type from, so client and API cannot disagree about it.</summary>',
      ],
    ],
  },
  {
    path: 'package.json',
    edits: [
      [
        '"description": "Jig — AI-native desktop template (Tauri + Angular SPA + .NET FastEndpoints). Build the fixture once; every app comes out identical.",',
        '"description": "Jig — AI-native app template (Angular SPA + .NET FastEndpoints). Build the fixture once; every app comes out identical.",',
      ],
    ],
  },
  {
    path: '.gitattributes',
    edits: [
      [
        '# LF everywhere. The tooling (node, dotnet, cargo, git-bash) is line-ending',
        '# LF everywhere. The tooling (node, dotnet, git-bash) is line-ending',
      ],
    ],
  },
  {
    path: '.github/workflows/verify.yml',
    edits: [
      [
        '# One job, not one job per subsystem. Splitting into parallel .NET/Rust/frontend jobs',
        '# One job, not one job per subsystem. Splitting into parallel .NET/frontend jobs',
      ],
      [
        `    # Windows matches the desktop target: WebView2 is present, so the Tauri crate
    # compiles without the Linux system-dependency setup.
    runs-on: windows-latest`,
        `    # Windows matches the machines this template is developed on; nothing in the
    # gate is platform-specific, so a Linux runner works just as well.
    runs-on: windows-latest`,
      ],
      ['areas="dotnet,rust,frontend,tools,contracts"', 'areas="dotnet,frontend,tools,contracts"'],
    ],
  },

  // ---- the constitution and the working manual ----------------------------
  {
    path: 'CLAUDE.md',
    edits: [
      [
        'a shared component, a capability service, a Rust command helper), run this checklist in order:',
        'a shared component, a capability service), run this checklist in order:',
      ],
      ['Holds in TypeScript, C#, and Rust.', 'Holds in TypeScript and C#.'],
      ['| Touch the transport seam (IPC or HTTP) |', '| Touch the transport seam |'],
      [
        'Native LSP covers TypeScript and Rust (install via `/plugin`); C# is wired through `.lsp.json`.',
        'Native LSP covers TypeScript (install via `/plugin`); C# is wired through `.lsp.json`.',
      ],
      ['| The same gate minus .NET and Rust, for the inner loop.', '| The same gate minus .NET, for the inner loop.'],
      [
        'mirror of the app, ADR 0007), conduit, spartan, adding-an-angular-service',
        'mirror of the app, ADR 0007), spartan, adding-an-angular-service',
      ],
    ],
  },
  {
    path: 'CONTRIBUTING.md',
    edits: [
      ['`Jig.Infrastructure`; the Rust crate and Tauri identifier are `jig`; spartan helm', '`Jig.Infrastructure`; spartan helm'],
      [' * Folds HTTP and IPC failures into one AppError at a single seam.', ' * Folds every wire failure into one AppError at a single seam.'],
      [
        'Rust (rustdoc): `/// @capability`, `/// @intent`, `/// @reuse`. C# (XML doc): `<capability>`, `<intent>`, `<reuse>`.',
        'C# (XML doc): `<capability>`, `<intent>`, `<reuse>`.',
      ],
      ['the full build, all tests across .NET, Rust, and the frontend, plus catalog freshness.', 'the full build, all tests across .NET and the frontend, plus catalog freshness.'],
      ['checks the toolchain and all three language servers,', 'checks the toolchain and both language servers,'],
      ['`dotnet test services/api/Jig.sln`, `cargo test` (in `apps/desktop/src-tauri`), `npm --prefix frontend test`', '`dotnet test services/api/Jig.sln`, `npm --prefix frontend test`'],
      ['The `users` slice ships with tests at all three levels as the reference pattern future features copy.', 'The `users` slice ships with tests at both levels as the reference pattern future features copy.'],
    ],
  },
  {
    path: 'README.md',
    edits: [
      [
        'Jig is an AI-native desktop template. One Angular SPA runs two ways: as a **thick client** inside a Tauri shell (Rust core, IPC) and as a **thin client** against a remote **.NET FastEndpoints** API (HTTP). One frontend, two wires. It is optimized',
        'Jig is an AI-native app template: an Angular SPA running as a **thin client** against a **.NET FastEndpoints** API over HTTP. It is optimized',
      ],
      ['restores .NET and Rust, and generates the capability catalog.', 'restores .NET, and generates the capability catalog.'],
      ['every test suite across all three languages plus the catalog freshness check.', 'every test suite across both languages plus the catalog freshness check.'],
      [
        'the .NET 10 SDK, the Rust toolchain, the Tauri CLI, and three language servers (`rust-analyzer`, a TypeScript server, and `csharp-ls`).',
        'the .NET 10 SDK, and two language servers (a TypeScript server and `csharp-ls`).',
      ],
      [
        `    Port -. "isTauri() at bootstrap" .-> Ipc["IpcTransport -> Rust core"]
    Port -.-> Http["HttpTransport -> .NET API"]`,
        '    Port --> Http["HttpTransport -> .NET API"]',
      ],
      ['Response types are the OpenAPI-generated DTOs, so HTTP and IPC cannot disagree.', 'Response types are the OpenAPI-generated DTOs, so the client and the API cannot disagree.'],
      [
        '- **Transport** (`frontend/src/app/transport`): the only place that knows two wires exist. The wire is chosen once, at bootstrap, by `isTauri()`. Errors from either wire fold into one `AppError` at a single seam.',
        '- **Transport** (`frontend/src/app/transport`): the only place that knows a wire exists. It is wired once, at bootstrap, and every failure folds into one `AppError` at a single seam.',
      ],
    ],
  },
  {
    path: 'docs/architecture/conduit.md',
    edits: [
      [
        'One Angular frontend runs unchanged over two wires: Tauri IPC (invoke) as a thick client, and HTTP to the .NET API as a thin client. The transport seam is the only place in the frontend that knows two worlds exist. View, ViewModel, repository, and domain stay identical regardless of wire.',
        'The Angular frontend reaches the .NET API over one wire, and the transport seam is the only place in the frontend that knows a wire exists. View, ViewModel, repository, and domain never learn how a request travels.',
      ],
      [
        `    Port -. "isTauri() at bootstrap" .-> Ipc["IpcTransport (invoke)"]
    Port -.-> Http["HttpTransport (HttpClient)"]
    Ipc --> Rust["Rust core (thick)"]
    Http --> Api[".NET API (thin)"]`,
        `    Port --> Http["HttpTransport (HttpClient)"]
    Http --> Api[".NET API"]`,
      ],
      [
        'Both transports key off it, so TypeScript forces parity and the contract cannot drift. Every operation appears in both `ROUTES` (HTTP) and `COMMANDS` (IPC); the compiler enforces that.',
        'The transport keys off it, so TypeScript forces parity and the contract cannot drift. Every operation appears in `ROUTES`; the compiler enforces that.',
      ],
      ['- Response types resolve to the **OpenAPI-generated DTOs**, so HTTP and IPC cannot disagree about a shape.', '- Response types resolve to the **OpenAPI-generated DTOs**, so the client and the API cannot disagree about a shape.'],
      [
        '- **One error seam.** No `HttpErrorResponse` and no raw `invoke` rejection may reach a repository or ViewModel. `NormalizingTransport` folds both into one `AppError`.',
        '- **One error seam.** No `HttpErrorResponse` may reach a repository or ViewModel. `NormalizingTransport` folds every failure into one `AppError`.',
      ],
      [
        `
The port is a DI seam: an app that genuinely needs per-operation routing (some operations over HTTP, others over IPC in one build) can supply a composite transport that dispatches per operation, at the cost of the parity guarantee above; record that departure as an ADR.

If you need cross-transport reasoning beyond this file, the \`conduit\` skill covers the full design rationale.
`,
        `
The port is a DI seam: an app that later grows a second wire supplies another \`Transport\` implementation at the bootstrap factory and changes nothing above it. Record that departure as an ADR.
`,
      ],
    ],
  },
  {
    path: 'docs/architecture/rules/no-feature-inject-data.md',
    edits: [
      ['not have an opinion on whether the wire is IPC or HTTP.', 'not have an opinion on how a request reaches the API.'],
    ],
  },

  // ---- prompts and skills -------------------------------------------------
  {
    path: '.bob/prompts/install-catalog-and-gates.md',
    edits: [
      ['doc-comment syntax (`///` Rust, `/** */` JS/TS,', 'doc-comment syntax (`/** */` JS/TS,'],
    ],
  },
  {
    path: '.bob/prompts/new-feature.md',
    edits: [
      [
        'and their HTTP route and IPC command to `frontend/src/app/contracts/registry.ts` (`ROUTES` and `COMMANDS`). The mapped types force both wires to cover every operation.',
        'and their HTTP route to `frontend/src/app/contracts/registry.ts` (`ROUTES`). The mapped type forces the wire to cover every operation.',
      ],
    ],
  },
  {
    path: '.claude/skills/adding-an-angular-service/SKILL.md',
    edits: [
      ['| is the wire itself (HTTP, IPC, error normalizing) | **transport** |', '| is the wire itself (HTTP, error normalizing) | **transport** |'],
      ['Response types are the OpenAPI-generated DTOs, so HTTP and IPC cannot disagree.', 'Response types are the OpenAPI-generated DTOs, so the client and the API cannot disagree.'],
    ],
  },
  {
    path: '.claude/skills/jig-design/SKILL.md',
    edits: [
      ['AI-native desktop app template (Angular SPA over Tauri IPC + a .NET API).', 'AI-native app template (Angular SPA over a .NET API).'],
    ],
  },
  {
    path: '.claude/skills/jig-design/readme.md',
    edits: [
      [
        `one Angular SPA that runs two ways: as a **thick client** inside a Tauri shell
(Rust core, IPC) and as a **thin client** against a remote **.NET FastEndpoints**`,
        `one Angular SPA running as a **thin client** against a remote **.NET FastEndpoints**`,
      ],
    ],
  },
  {
    path: '.claude/skills/jig-design/ui_kits/jig-app/AppScreen.jsx',
    edits: [
      ["              { label: 'IPC · Rust core' },\n", ''],
      [
        `        <span className="hlm-kbd">IPC</span>
        <span>Connected to Rust core · thick client</span>
`,
        `        <span className="hlm-kbd">HTTP</span>
        <span>Connected to the .NET API</span>
`,
      ],
    ],
  },
  {
    path: '.claude/skills/jig-design/_ds_bundle.js',
    edits: [
      [
        `    }, {
      label: 'IPC · Rust core'
    }]`,
        `    }]`,
      ],
      [
        `}, "IPC"), /*#__PURE__*/React.createElement("span", null, "Connected to Rust core \\xB7 thick client")`,
        `}, "HTTP"), /*#__PURE__*/React.createElement("span", null, "Connected to the .NET API")`,
      ],
    ],
  },
  {
    path: '.claude/skills/jig-design/components/core/core.card.html',
    edits: [
      [
        `            <Separator orientation="vertical" />
            <span style={{ fontSize: 13 }}>Rust</span>
`,
        '',
      ],
    ],
  },
  {
    path: '.claude/skills/jig-design/components/navigation/navigation.card.html',
    edits: [
      [
        "{ label: 'Transport', items: [ { label: 'HTTP' }, { label: 'IPC' } ] },",
        "{ label: 'Transport', items: [ { label: 'HTTP' } ] },",
      ],
    ],
  },

  // ---- tooling ------------------------------------------------------------
  {
    path: 'tools/verify/verify.ts',
    edits: [
      ["const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');\n", ''],
      [' * Every step, in order, tagged with whether it is native — .NET or Rust.', ' * Every step, in order, tagged with whether it is native — .NET.'],
      ['still paid for `dotnet test` and `cargo test` on every run, and a', 'still paid for `dotnet test` on every run, and a'],
      ['/** Needs the .NET or Rust toolchain, so `--frontend` drops it. */', '/** Needs the .NET toolchain, so `--frontend` drops it. */'],
      [
        "{ name: 'catalog freshness', cmd: 'node tools/catalog/catalog.ts --check', cwd: ROOT, areas: ['dotnet', 'rust', 'frontend', 'tools'] },",
        "{ name: 'catalog freshness', cmd: 'node tools/catalog/catalog.ts --check', cwd: ROOT, areas: ['dotnet', 'frontend', 'tools'] },",
      ],
      [
        "console.log('Frontend gate: skipping .NET and Rust. Run `npm run verify` before committing.');",
        "console.log('Frontend gate: skipping .NET. Run `npm run verify` before committing.');",
      ],
      [
        "'\\nVERIFY OK (frontend) - .NET and Rust were NOT run. Run `npm run verify` before committing.'",
        "'\\nVERIFY OK (frontend) - .NET was NOT run. Run `npm run verify` before committing.'",
      ],
    ],
  },
  {
    path: 'tools/verify/select.ts',
    edits: [
      ['// possibly be broken by, so a Rust-only change stops running Playwright and a', '// possibly be broken by, so a backend-only change stops running Playwright and a'],
      [
        "export const ALL_AREAS = ['dotnet', 'rust', 'frontend', 'tools', 'contracts'] as const;",
        "export const ALL_AREAS = ['dotnet', 'frontend', 'tools', 'contracts'] as const;",
      ],
      ["  if (p.startsWith('apps/')) return 'rust';\n", ''],
    ],
  },
  {
    path: 'tools/verify/select.test.ts',
    edits: [
      ["    assert.equal(classify('apps/desktop/src-tauri/src/main.rs'), 'rust');\n", ''],
      ["    { name: 'rust tests', areas: ['rust'] },\n", ''],
      [
        `    const chosen = selectSteps(steps, new Set(['rust', 'dotnet'])).map((s) => s.name);
    assert.deepEqual(chosen, ['dotnet tests', 'rust tests']);`,
        `    const chosen = selectSteps(steps, new Set(['dotnet'])).map((s) => s.name);
    assert.deepEqual(chosen, ['dotnet tests']);`,
      ],
    ],
  },
  {
    path: 'tools/verify/areas.ts',
    edits: [
      ['// CI runs this immediately after checkout — before installing .NET, Rust, or a Playwright', '// CI runs this immediately after checkout — before installing .NET or a Playwright'],
    ],
  },
  {
    path: 'tools/codegen/generate.ts',
    edits: [
      ['// source of truth for every wire shape, so HTTP and IPC cannot disagree.', '// source of truth for every wire shape, so the client and the API cannot disagree.'],
    ],
  },
  {
    path: 'tools/hooks/angular-service-guide.ts',
    edits: [
      [
        "'the Transport port, never a concrete wire; isTauri() lives only in provide-transport.ts).';",
        "'the Transport port, never a concrete wire; the wire is chosen only in provide-transport.ts).';",
      ],
    ],
  },
  {
    path: 'tools/catalog/parse.test.ts',
    edits: [
      [' * Folds HTTP and IPC failures into one AppError at a single seam.', ' * Folds every wire failure into one AppError at a single seam.'],
      ["parseAnnotations(src, 'apps/desktop/src-tauri/src/tray.rs');", "parseAnnotations(src, 'services/native/src/tray.rs');"],
    ],
  },
];

const THICK_BLOCK =
  /[ \t]*(?:<!--\s*thick:start\s*-->|\/\/\s*thick:start|#\s*thick:start)[\s\S]*?(?:<!--\s*thick:end\s*-->|\/\/\s*thick:end|#\s*thick:end)[ \t]*\r?\n?/g;

/** Remove thick-client-only prose wrapped in `thick:start` / `thick:end` markers. */
export function stripThickBlocks(text: string): string {
  return text.replace(THICK_BLOCK, '');
}

const THICK_MARKER_LINE =
  /^[ \t]*(?:<!--\s*thick:(?:start|end)\s*-->|\/\/\s*thick:(?:start|end)|#\s*thick:(?:start|end))[ \t]*\r?\n/gm;

/**
 * Drop the marker lines but keep what they wrap. This is the thick side of the same
 * coin: init deletes `tools/init`, so once an app is initialized nothing can ever
 * read a marker again, and leaving them behind litters every thick app with comments
 * that answer a question it no longer has.
 */
export function stripThickMarkers(text: string): string {
  return text.replace(THICK_MARKER_LINE, '');
}

/**
 * Apply the thin cut to one file's content: strip thick-marked blocks, then apply
 * that path's literal edits. Throws when an edit's anchor is missing or appears
 * more than once — a silently skipped edit would ship a broken app.
 */
export function toThin(path: string, text: string, patches: readonly Patch[] = THIN_PATCHES): string {
  // Anchors are written with LF, but the working tree is not uniformly LF — despite
  // `.gitattributes eol=lf`, files rewritten by an editor or a generator come back
  // CRLF on Windows. A multi-line anchor compared against CRLF text matches nothing,
  // and the whole point of this module is that a missed edit is loud rather than
  // silent, so normalize before matching and restore the file's own endings after.
  const crlf = text.includes('\r\n');
  let out = stripThickBlocks(crlf ? text.replace(/\r\n/g, '\n') : text);
  const patch = patches.find((p) => p.path === path);
  if (!patch) return crlf ? out.replace(/\n/g, '\r\n') : out;

  for (const [find, replace] of patch.edits) {
    const first = out.indexOf(find);
    if (first === -1) {
      throw new Error(`thin patch for ${path}: anchor not found: ${JSON.stringify(find.slice(0, 90))}`);
    }
    if (out.indexOf(find, first + find.length) !== -1) {
      throw new Error(`thin patch for ${path}: anchor is ambiguous: ${JSON.stringify(find.slice(0, 90))}`);
    }
    out = out.slice(0, first) + replace + out.slice(first + find.length);
  }
  return crlf ? out.replace(/\n/g, '\r\n') : out;
}
