#!/usr/bin/env node
// Template init: turn this Jig checkout into a fresh app.
//
// Renames every Jig/jig identifier to your app name (context-aware — see
// rename.ts), strips the template-only files, re-inits git with clean history,
// regenerates the catalog, verifies the renamed app is green, and commits.
//
// Two client shapes. `--thick` (the default, and only ever explicit) keeps both
// wires: the Tauri shell over IPC and the .NET API over HTTP. `--thin` cuts the
// desktop half — see tools/init/thin.ts for exactly what that removes and why.
//
// Run AFTER `npm run setup` (it assumes dependencies are installed). Pass the app
// name (and options) directly to the script, or through npm with `--`:
//   node tools/init/init.ts AcmePortal
//   node tools/init/init.ts AcmePortal --bundle-id=io.acme.desktop
//   node tools/init/init.ts AcmePortal --thin   (web only: no Tauri shell, no Rust core)
//   npm run init -- AcmePortal --skip-verify   (--skip-verify skips the full test gate)

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveNames, renameContent, renamePath, stripTemplateBlocks } from './rename.ts';
import { THIN_DELETE, THIN_DROP_DEPENDENCY, stripThickMarkers, toThin } from './thin.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
const shOut = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();

const BINARY = ['.png', '.ico', '.icns', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.webp', '.thumbnail'];
// '.claude/hook-firings.jsonl' is git-ignored, so `renameContent` never sees it and
// `git ls-files` never lists it for step 1's content rewrite — but this list is what
// actually deletes files, and without an entry here `init` would leave the template
// author's firing telemetry on disk for a freshly cloned app to silently inherit as
// its own enforcement baseline. That is a measurement lying about whose drift it
// recorded, so it is listed here even though no other step would ever touch it.
const TEMPLATE_ONLY = ['.bob/adr/0000-origin-prompt.md', 'docs/superpowers', 'tools/init', '.claude/hook-firings.jsonl'];

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    name: args.find((a) => !a.startsWith('--')),
    bundleId: (args.find((a) => a.startsWith('--bundle-id=')) ?? '').split('=')[1] || undefined,
    skipVerify: args.includes('--skip-verify'),
    thin: args.includes('--thin'),
    thick: args.includes('--thick'),
  };
}

/** True when the thin cut removes this path outright. */
const droppedByThin = (rel) => THIN_DELETE.some((p) => rel === p || rel.startsWith(`${p}/`));

function main() {
  const { name, bundleId, skipVerify, thin, thick } = parseArgs(process.argv);
  const usage =
    'Usage: npm run init <AppNamePascalCase> [--thin|--thick] [--bundle-id=com.org.app] [--skip-verify]';
  if (!name) {
    console.error(usage);
    console.error('\n  --thick   both wires: Tauri shell over IPC and the .NET API over HTTP (the default)');
    console.error('  --thin    web only: deletes the Tauri shell and the Rust core, HTTP wire only');
    process.exit(1);
  }
  // The pair is not symmetric — thick is what the template already is — so asking
  // for both is a contradiction rather than a redundancy, and guessing which one
  // was meant would silently ship the wrong app.
  if (thin && thick) {
    console.error('Refusing to run: --thin and --thick are mutually exclusive.');
    process.exit(1);
  }

  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  if (rootPkg.name !== 'jig') {
    console.error(`Refusing to run: package.json name is "${rootPkg.name}", not "jig". This is not a fresh Jig template.`);
    process.exit(1);
  }

  const n = deriveNames(name, bundleId);
  const shape = thin ? 'thin (HTTP only)' : 'thick (IPC + HTTP)';
  console.log(`Initializing as ${n.pascal}  (npm: ${n.kebab}, rust: ${n.snake}, bundle: ${n.bundleId})`);
  console.log(`Client: ${shape}\n`);

  // 0. The thin cut, before anything else touches these paths: drop the desktop
  // shell and everything that only exists to serve it, so no later step renames,
  // rewrites, or gates a file that is on its way out.
  const tracked = shOut('git ls-files').split('\n').filter(Boolean);
  const files = thin ? tracked.filter((rel) => !droppedByThin(rel)) : tracked;
  if (thin) {
    for (const p of THIN_DELETE) rmSync(join(ROOT, p), { recursive: true, force: true });
    console.log('  desktop shell removed');
  }

  // 1. Rewrite content of every tracked text file. The thin cut runs between the
  // template strip and the rename so its anchors match the template as committed.
  for (const rel of files) {
    if (BINARY.some((e) => rel.endsWith(e))) continue;
    const abs = join(ROOT, rel);
    const before = readFileSync(abs, 'utf8');
    const stripped = stripTemplateBlocks(before);
    const after = renameContent(thin ? toThin(rel, stripped) : stripThickMarkers(stripped), n);
    if (after !== before) writeFileSync(abs, after);
  }
  console.log('  content rewritten');

  // 2. Rename paths (files carry their dirs), deepest first; then drop leftover
  // source dirs. A path is renamed when renamePath changes it — this catches both
  // the PascalCase `Jig.*` .NET dirs and the lowercase `jig-design` skill folder.
  for (const rel of [...files].filter((r) => renamePath(r, n) !== r).sort((a, b) => b.length - a.length)) {
    const src = join(ROOT, rel);
    const dst = join(ROOT, renamePath(rel, n));
    if (src === dst || !existsSync(src)) continue;
    mkdirSync(dirname(dst), { recursive: true });
    renameSync(src, dst);
  }
  for (const dir of new Set(files.map((r) => dirname(r)).filter((d) => renamePath(d, n) !== d))) {
    rmSync(join(ROOT, dir), { recursive: true, force: true });
  }
  console.log('  paths renamed');

  // 3. Tauri productName is a display name — prefer Pascal over the generic kebab
  // pass. There is no Tauri config left to name after a thin cut.
  if (!thin) {
    const confPath = join(ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
    const conf = JSON.parse(readFileSync(confPath, 'utf8'));
    conf.productName = n.pascal;
    writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
  }

  // 4. Strip template-only files (full reset) and the now-dead `init` script.
  for (const p of TEMPLATE_ONLY) rmSync(join(ROOT, p), { recursive: true, force: true });
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts.init;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  template-only files removed');

  // 4b. Uninstall the dependency only the IPC wire used. This runs npm rather than
  // editing package.json by hand: dropping the entry alone leaves package-lock.json
  // still pinning the package, and `npm ci` — which is what CI runs — fails on a
  // lockfile that disagrees with the manifest. Init assumes a live environment
  // already (it ends by running the full gate), so paying for one npm call here is
  // cheaper than shipping an app whose first CI run is red.
  if (thin) {
    sh(`npm uninstall ${THIN_DROP_DEPENDENCY}`, { cwd: join(ROOT, 'frontend') });
    console.log(`  ${THIN_DROP_DEPENDENCY} uninstalled`);
  }

  // 5. Regenerate the catalog (file paths changed).
  sh('node tools/catalog/catalog.ts');

  // 6. Fresh git history + re-wire the hooks (config is not carried across init).
  rmSync(join(ROOT, '.git'), { recursive: true, force: true });
  sh('git init -q -b main');
  sh('git config core.autocrlf false');
  sh('git config core.hooksPath .githooks');
  console.log('  git re-initialized');

  // 7. Prove the renamed app is green.
  if (!skipVerify) {
    console.log('\nRunning verify (full build + all tests)...');
    sh('node tools/verify/verify.ts');
  }

  // 8. Commit the fresh app. This bootstrap commit is the one sanctioned commit on
  // main; JIG_ALLOW_MAIN lets it past the feature-branch gate (see .githooks/pre-commit).
  sh('git add -A');
  sh(`git commit -q -m "chore(repo): initialize ${n.pascal} from the Jig template"`, {
    env: { ...process.env, JIG_ALLOW_MAIN: '1' },
  });

  console.log(`\nDone. ${n.pascal} is initialized as a ${shape} client on a fresh git history.`);
  console.log(
    thin
      ? 'Next: review CLAUDE.md, point API_BASE_URL at your API, and build your first feature.'
      : 'Next: review CLAUDE.md, set your bundle id / signing, and build your first feature.',
  );
}

main();
