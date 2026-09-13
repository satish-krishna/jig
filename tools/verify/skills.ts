#!/usr/bin/env node
// Referential integrity for .claude/skills/.
//
// Skills are procedure an agent executes, so a path that moved or a rule that was
// renamed does not merely mislead a careful reader — it gets wrong code written.
// `.bob/prompts/new-feature.md` died of exactly this: nothing pointed at it and
// nothing checked it, so nobody found out.
//
// Two checks, both cheap:
//   1. every repo-relative path a skill cites still resolves
//   2. every lint rule a skill names is a real rule in the jig plugin
//
// Thin-client vocabulary leaking into a skill is NOT checked here. It is already
// checked, and better, by tools/init/thin.test.ts's residue scan, which applies the
// real cut and rejects ten patterns rather than four. Re-checking it here would also
// require importing tools/init/thin.ts — and init deletes the whole of tools/init/
// from every generated app, so that import would be broken in every clone.
//
// What is deliberately NOT checked: whether a description actually triggers. That
// is the property most likely to be wrong and there is no honest test for it. Any
// proxy — a length floor, a "must quote a phrase" rule — is gameable in one edit and
// would manufacture confidence. Trigger quality stays human-reviewed.
//
// Kept pure apart from `checkSkills` and `main` so the parsers are unit-tested
// without a fixture tree.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import plugin from '../lint/index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILLS_DIR = '.claude/skills';

/** Every markdown file under `.claude/skills/`, repo-relative, sorted. */
export function skillFiles(root: string = ROOT): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    const abs = join(root, rel);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (entry.name.endsWith('.md')) out.push(child);
    }
  };
  walk(SKILLS_DIR);
  return out.sort();
}

// A cited path is backticked, contains a slash, and is not something else that
// happens to contain one. Globs, type signatures, shell commands and URLs all do —
// and so, it turns out, do three more shapes the real corpus contains: an npm scoped
// package specifier (`@spartan-ng/brain`), an absolute web route (`/users`), and a
// custom URI scheme (`spartan://component/{name}/api`). None of those are ever
// spelled as a repo-relative path in this codebase, so they are excluded on shape
// rather than by an allowlist of literal tokens.
const BACKTICKED = /`([^`\n]+)`/g;
const NOT_A_PATH = /[*<>()\s?|{}$]|^[a-zA-Z][\w+.-]*:\/\/|^\.{3}|^@|^\//;

/** The repo-relative paths a skill body cites. */
export function citedPaths(text: string): string[] {
  const found: string[] = [];
  for (const [, token] of text.matchAll(BACKTICKED)) {
    if (!token.includes('/')) continue;
    if (NOT_A_PATH.test(token)) continue;
    found.push(token);
  }
  return found;
}

const RULES_HEADING = /^##\s+Rules that bite here\s*$/;
const ANY_HEADING = /^##\s/;

/**
 * The lint rule names a skill claims bite in its area.
 *
 * A line scan rather than one regex: JavaScript has no end-of-input anchor, so
 * "this section until the next `##` or the end of the file" cannot be written as a
 * lookahead without a trick that reads worse than the loop.
 */
export function citedRuleIds(text: string): string[] {
  const ids: string[] = [];
  let inside = false;
  for (const line of text.split('\n')) {
    if (RULES_HEADING.test(line)) { inside = true; continue; }
    if (inside && ANY_HEADING.test(line)) break;
    if (!inside) continue;
    for (const [, token] of line.matchAll(BACKTICKED)) {
      // A doc path in this section is checked by citedPaths, not here.
      if (token.includes('/') && !token.startsWith('jig/')) continue;
      ids.push(token);
    }
  }
  return ids;
}

/** Those of `ids` that the jig ESLint plugin does not define. */
export function unknownRuleIds(ids: readonly string[]): string[] {
  const known = new Set(Object.keys(plugin.rules as Record<string, unknown>));
  return ids
    .map((id) => (id.startsWith('jig/') ? id.slice('jig/'.length) : id))
    .filter((id) => !known.has(id));
}

/** Every integrity failure, one human-readable line each. Empty means green. */
export function checkSkills(root: string = ROOT): string[] {
  const failures: string[] = [];
  for (const rel of skillFiles(root)) {
    const text = readFileSync(join(root, rel), 'utf8');
    const skillDir = dirname(rel);

    for (const cited of citedPaths(text)) {
      // A citation resolves from the repo root (the common case) or, failing that,
      // from the citing file's own directory — several skills point at a sibling
      // doc with a plain relative path, e.g. conduit/SKILL.md's `references/....md`.
      const fromRoot = existsSync(join(root, cited));
      const fromSkillDir = existsSync(join(root, skillDir, cited));
      if (!fromRoot && !fromSkillDir) {
        failures.push(`${rel}: cites a path that does not exist: ${cited}`);
      }
    }

    for (const id of unknownRuleIds(citedRuleIds(text))) {
      failures.push(`${rel}: names a lint rule the jig plugin does not define: ${id}`);
    }
  }
  return failures;
}

function main() {
  const failures = checkSkills();
  if (failures.length === 0) {
    console.log(`Skills intact (${skillFiles().length} files).`);
    return;
  }
  console.error('Skill integrity failed:');
  for (const line of failures) console.error(`  ${line}`);
  console.error('\nFix the skill, not the check. A skill that cites a moved file gets wrong code written against it.');
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
