#!/usr/bin/env node
// Template init: turn this Jig checkout into a fresh app.
//
// Renames every Jig/jig identifier to your app name (context-aware — see
// rename.ts), strips the template-only files, re-inits git with clean history,
// regenerates the catalog, verifies the renamed app is green, and commits.
//
// Run AFTER `npm run setup` (it assumes dependencies are installed). Pass the app
// name (and options) directly to the script, or through npm with `--`:
//   node tools/init/init.ts AcmePortal
//   node tools/init/init.ts AcmePortal --bundle-id=io.acme.desktop
//   npm run init -- AcmePortal --skip-verify   (--skip-verify skips the full test gate)

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveNames, renameContent, renamePath, stripTemplateBlocks } from './rename.ts';

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
const TEMPLATE_ONLY = ['bootstrap-prompt.md', 'docs/superpowers', 'tools/init', '.claude/hook-firings.jsonl'];

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    name: args.find((a) => !a.startsWith('--')),
    bundleId: (args.find((a) => a.startsWith('--bundle-id=')) ?? '').split('=')[1] || undefined,
    skipVerify: args.includes('--skip-verify'),
  };
}

function main() {
  const { name, bundleId, skipVerify } = parseArgs(process.argv);
  if (!name) {
    console.error('Usage: npm run init <AppNamePascalCase> [--bundle-id=com.org.app] [--skip-verify]');
    process.exit(1);
  }

  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  if (rootPkg.name !== 'jig') {
    console.error(`Refusing to run: package.json name is "${rootPkg.name}", not "jig". This is not a fresh Jig template.`);
    process.exit(1);
  }

  const n = deriveNames(name, bundleId);
  console.log(`Initializing as ${n.pascal}  (npm: ${n.kebab}, rust: ${n.snake}, bundle: ${n.bundleId})\n`);

  // 1. Rewrite content of every tracked text file.
  const files = shOut('git ls-files').split('\n').filter(Boolean);
  for (const rel of files) {
    if (BINARY.some((e) => rel.endsWith(e))) continue;
    const abs = join(ROOT, rel);
    const before = readFileSync(abs, 'utf8');
    const after = renameContent(stripTemplateBlocks(before), n);
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

  // 3. Tauri productName is a display name — prefer Pascal over the generic kebab pass.
  const confPath = join(ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
  const conf = JSON.parse(readFileSync(confPath, 'utf8'));
  conf.productName = n.pascal;
  writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');

  // 4. Strip template-only files (full reset) and the now-dead `init` script.
  for (const p of TEMPLATE_ONLY) rmSync(join(ROOT, p), { recursive: true, force: true });
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts.init;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  template-only files removed');

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

  console.log(`\nDone. ${n.pascal} is initialized on a fresh git history.`);
  console.log('Next: review CLAUDE.md, set your bundle id / signing, and build your first feature.');
}

main();
