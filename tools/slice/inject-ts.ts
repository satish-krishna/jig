// Injects a generated slice into the four TypeScript registries that already exist and
// cannot simply be overwritten: the operation contract, the transport registry (an HTTP
// route and a native command name per operation), the route table, and the app-wide
// providers. Every function here is pure — a source string and a spec in, a source
// string out, no disk access — and every function locates its target with the
// TypeScript AST, then splices plain text at a computed offset. None
// of them run the TypeScript printer: printing would reformat the whole file, and every
// generated slice would then arrive as a gratuitous whole-file diff that buries the real
// change. Each function also returns `source` unchanged when the slice is already present,
// so running the generator twice for the same slice is a no-op rather than a duplicate.

import ts from '../../frontend/node_modules/typescript/lib/typescript.js';
import type { SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';

/** Parse a file's text into a TypeScript AST for locating splice points. */
export function parse(file: string, source: string): ts.SourceFile {
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
}

/** Splice `text` in at a raw offset. The one primitive every helper below reduces to. */
function spliceAt(source: string, at: number, text: string): string {
  return source.slice(0, at) + text + source.slice(at);
}

/**
 * Splice `text` in just before the node's closing token (`node.end - 1`). Never reprints.
 * Reads cleanly on a top-level construct whose closing brace/bracket sits flush at
 * column 0 — the `Operations` interface, the `ROUTES`/`COMMANDS` object literals, the
 * lucide named-import list — because there is no existing indentation to disturb.
 */
export function insertInto(source: string, node: ts.Node, text: string): string {
  return spliceAt(source, node.end - 1, text);
}

/** Splice `text` in right after a node's own end — for appending a new statement or import. */
function insertAfter(source: string, node: ts.Node, text: string): string {
  return spliceAt(source, node.end, text);
}

/** Splice `text` in right before a node's start (skipping its leading trivia). */
function insertBefore(source: string, sf: ts.SourceFile, node: ts.Node, text: string): string {
  return spliceAt(source, node.getStart(sf), text);
}

/**
 * Splice `text` in just inside a node's opening brace/bracket rather than before its
 * closing one. Used for a literal nested inside another literal — the `providers` array,
 * the `provideIcons({...})` call — whose closing token carries its own indentation;
 * splicing before that closing token (the `insertInto` technique) would leave it
 * misindented. Splicing after the opening token instead leaves the closing line untouched.
 */
function insertAfterOpen(source: string, sf: ts.SourceFile, node: ts.Node, text: string): string {
  return spliceAt(source, node.getStart(sf) + 1, text);
}

/** Every top-level import declaration, in source order. */
function topLevelImports(sf: ts.SourceFile): ts.ImportDeclaration[] {
  return sf.statements.filter(ts.isImportDeclaration);
}

/**
 * The last of a list of import declarations, to splice a new import in right after. Shared
 * by injectRoutes and injectAppConfig, both of which anchor their new import the same way;
 * injectAppConfig also reuses the same `imports` list afterward to find the lucide import.
 */
function lastImportOrThrow(imports: readonly ts.ImportDeclaration[], file: string): ts.ImportDeclaration {
  const last = imports[imports.length - 1];
  if (!last) throw new Error(`${file}: could not find an import to anchor after`);
  return last;
}

// ---------------------------------------------------------------------------
// contracts/operations.ts
// ---------------------------------------------------------------------------

/**
 * Add a slice's two DTO type aliases and three `Operations` keys to operations.ts.
 *
 * @capability tools.slice.inject-operations
 * @intent Grow the operation contract for a generated slice without reprinting the file.
 * @reuse Call once per slice from the generator CLI; idempotent on the opPrefix's list key.
 */
export function injectOperations(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  if (source.includes(`'${n.opPrefix}.list'`)) return source;

  const sf = parse('operations.ts', source);
  const iface = sf.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === 'Operations',
  );
  if (!iface) throw new Error('operations.ts: could not find the Operations interface');

  // Only the DTO aliases declared *before* Operations are candidates: the file also
  // declares OperationName/Req/Res as type aliases right after the interface (they key
  // off it), and anchoring on those would splice the new DTOs at the end of the file.
  const aliasesBeforeInterface = sf.statements.filter(
    (s): s is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(s) && s.end < iface.getStart(sf),
  );
  const lastAlias = aliasesBeforeInterface[aliasesBeforeInterface.length - 1];
  if (!lastAlias) throw new Error('operations.ts: could not find a type alias to anchor the new DTOs after');

  const members =
    `  '${n.opPrefix}.list': { req: Record<string, never>; res: ${n.pascal}Dto[] };\n` +
    `  '${n.opPrefix}.get': { req: { id: string }; res: ${n.pascal}Dto };\n` +
    `  '${n.opPrefix}.save': { req: Save${n.pascal}Input; res: ${n.pascal}Dto };\n`;
  const dtoAliases =
    `\nexport type ${n.pascal}Dto = Schemas['${n.pascal}Response'];\n` +
    `export type Save${n.pascal}Input = Schemas['Save${n.pascal}Request'];`;

  // The interface sits after every type alias, so its end offset is the larger one.
  // Splice it first: the alias's own end offset (from this same, unmodified parse)
  // stays valid for the second splice only because nothing before it has moved yet.
  const withMembers = insertInto(source, iface, members);
  return insertAfter(withMembers, lastAlias, dtoAliases);
}

// ---------------------------------------------------------------------------
// contracts/registry.ts
// ---------------------------------------------------------------------------

/** Find `export const <name> = {...}`'s object-literal initializer among top-level statements. */
function findConstObject(sf: ts.SourceFile, file: string, name: string): ts.ObjectLiteralExpression {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText(sf) === name && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        return decl.initializer;
      }
    }
  }
  throw new Error(`${file}: could not find the ${name} object literal`);
}

/** findConstObject for a declaration that is legitimately absent in some shapes of a file. */
function findOptionalConstObject(sf: ts.SourceFile, name: string): ts.ObjectLiteralExpression | undefined {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText(sf) === name && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        return decl.initializer;
      }
    }
  }
  return undefined;
}

/**
 * Add a slice's three ROUTES entries to registry.ts, and its three COMMANDS entries when
 * that map is there to take them.
 *
 * ROUTES is required and COMMANDS is optional, because a registry with no COMMANDS map is
 * not a damaged registry — it is the shape a single-transport app ships, where the second
 * wire and the map naming its commands were both removed at init. Demanding both maps made
 * this injector throw in every such app, and it threw in the middle of the generator's
 * second phase, with the .NET half of the slice already written and codegen already run.
 *
 * Tolerating the absence cannot mask a real defect: COMMANDS is declared as
 * `{ [K in OperationName]: string }`, so a map that exists and is missing an operation is
 * a compile error in the app's own build. This injector is a convenience over that
 * compiler check, never a substitute for it.
 *
 * @capability tools.slice.inject-registry
 * @intent Keep the transport registry — an HTTP route and a native command name per
 * operation — in the compiler-enforced-parity shape.
 * @reuse Call once per slice from the generator CLI; idempotent on the opPrefix's list key.
 */
export function injectRegistry(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  if (source.includes(`'${n.opPrefix}.list':`)) return source;

  const sf = parse('registry.ts', source);
  const routesObj = findConstObject(sf, 'registry.ts', 'ROUTES');
  const commandsObj = findOptionalConstObject(sf, 'COMMANDS');

  const routesText =
    `  '${n.opPrefix}.list': { method: 'GET', path: () => '${n.route}', hasBody: false },\n` +
    `  '${n.opPrefix}.get': { method: 'GET', path: (req) => \`${n.route}/\${req.id}\`, hasBody: false },\n` +
    `  '${n.opPrefix}.save': { method: 'POST', path: () => '${n.route}', hasBody: true },\n`;
  const commandsText =
    `  '${n.opPrefix}.list': '${n.snakePlural}_list',\n` +
    `  '${n.opPrefix}.get': '${n.snakePlural}_get',\n` +
    `  '${n.opPrefix}.save': '${n.snakePlural}_save',\n`;

  // COMMANDS is declared after ROUTES, so its offset is the larger one — splice it first,
  // or inserting into ROUTES shifts every offset past it and the second splice lands wrong.
  const withCommands = commandsObj ? insertInto(source, commandsObj, commandsText) : source;
  return insertInto(withCommands, routesObj, routesText);
}

// ---------------------------------------------------------------------------
// app.routes.ts
// ---------------------------------------------------------------------------

/**
 * Add a slice's list-view import and route to app.routes.ts, inserted before the
 * catch-all `redirectTo` entry so that entry stays last (a route table's first match
 * wins, and the empty-path redirect must never shadow a real route).
 *
 * @capability tools.slice.inject-routes
 * @intent Wire a generated list view into the router without reprinting the route table.
 * @reuse Call once per slice from the generator CLI; idempotent on the view's import line.
 */
export function injectRoutes(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  if (source.includes(`import { ${n.pascal}ListView }`)) return source;

  const sf = parse('app.routes.ts', source);
  const lastImport = lastImportOrThrow(topLevelImports(sf), 'app.routes.ts');

  const routesArray = sf.statements
    .filter(ts.isVariableStatement)
    .flatMap((s) => s.declarationList.declarations)
    .find(
      (d): d is ts.VariableDeclaration & { initializer: ts.ArrayLiteralExpression } =>
        d.name.getText(sf) === 'routes' && !!d.initializer && ts.isArrayLiteralExpression(d.initializer),
    )?.initializer;
  if (!routesArray || routesArray.elements.length === 0) {
    throw new Error('app.routes.ts: could not find the routes array');
  }
  const catchAll = routesArray.elements[routesArray.elements.length - 1];

  const importText = `\nimport { ${n.pascal}ListView } from './features/${n.kebabPlural}/${n.kebab}-list.view';`;
  const routeText = `{ path: '${n.kebabPlural}', component: ${n.pascal}ListView },\n  `;

  // The catch-all redirect sits near the end of the file, past the imports, so its
  // offset is the larger one — splice it first.
  const withRoute = insertBefore(source, sf, catchAll, routeText);
  return insertAfter(withRoute, lastImport, importText);
}

// ---------------------------------------------------------------------------
// app.config.ts
// ---------------------------------------------------------------------------

/**
 * Wire a slice's menu provider and lucide icon into app.config.ts: the feature-menu
 * import, the `provide{Es}Menu()` call, and the icon in both the lucide named-import
 * list and the `provideIcons({...})` call. The menu wiring and the icon are tracked
 * independently — two slices can legitimately share an icon, so re-running this for a
 * slice whose icon another slice already imported must add the menu wiring without
 * duplicating the icon.
 *
 * @capability tools.slice.inject-app-config
 * @intent Register a generated slice's sidebar entry and icon app-wide, idempotently.
 * @reuse Call once per slice from the generator CLI.
 */
export function injectAppConfig(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  const alreadyWired = source.includes(`provide${n.pascalPlural}Menu`);

  const sf = parse('app.config.ts', source);
  const imports = topLevelImports(sf);
  const lastImport = lastImportOrThrow(imports, 'app.config.ts');

  const appConfigInit = sf.statements
    .filter(ts.isVariableStatement)
    .flatMap((s) => s.declarationList.declarations)
    .find((d) => d.name.getText(sf) === 'appConfig')?.initializer;
  if (!appConfigInit || !ts.isObjectLiteralExpression(appConfigInit)) {
    throw new Error('app.config.ts: could not find the appConfig object literal');
  }
  const providersArray = appConfigInit.properties.find(
    (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'providers',
  )?.initializer;
  if (!providersArray || !ts.isArrayLiteralExpression(providersArray)) {
    throw new Error('app.config.ts: could not find the providers array');
  }

  const lucideImport = imports.find((i) => i.moduleSpecifier.getText(sf).includes('@ng-icons/lucide'));
  const namedIcons = lucideImport?.importClause?.namedBindings;
  if (!namedIcons || !ts.isNamedImports(namedIcons)) {
    throw new Error('app.config.ts: could not find the @ng-icons/lucide import');
  }
  const hasIconImport = namedIcons.elements.some((e) => e.name.text === spec.icon);

  const provideIconsCall = providersArray.elements.find(
    (e): e is ts.CallExpression => ts.isCallExpression(e) && e.expression.getText(sf) === 'provideIcons',
  );
  const iconsArg = provideIconsCall?.arguments[0];
  if (!iconsArg || !ts.isObjectLiteralExpression(iconsArg)) {
    throw new Error('app.config.ts: could not find the provideIcons({...}) call');
  }
  const hasIconInProvide = iconsArg.properties.some((p) => p.name?.getText(sf) === spec.icon);

  // Every offset below was computed once, against this same, unmodified parse. Applying
  // them from the bottom of the file up keeps each one valid: an insertion never shifts
  // the position of anything that comes before it, only what comes after.
  let out = source;
  if (!hasIconInProvide) out = insertAfterOpen(out, sf, iconsArg, `\n      ${spec.icon},`);
  if (!alreadyWired) out = insertAfterOpen(out, sf, providersArray, `\n    provide${n.pascalPlural}Menu(),`);
  if (!alreadyWired) {
    out = insertAfter(
      out,
      lastImport,
      `\nimport { provide${n.pascalPlural}Menu } from './features/${n.kebabPlural}/${n.kebabPlural}.commands';`,
    );
  }
  if (!hasIconImport) out = insertInto(out, namedIcons, `  ${spec.icon},\n`);
  return out;
}
