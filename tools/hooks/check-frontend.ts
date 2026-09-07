#!/usr/bin/env node
// PostToolUse corrective: an agent just wrote or edited a frontend file. This runs the
// jig ESLint ruleset against that one file and, on any violation, hands the messages
// back with a worked example (ESLint's own message text) plus a pointer to the rule's
// own architecture document.
//
// This is a POST hook: it fires AFTER the write has already landed. Exit 2 hands the
// message back to the agent; it does not undo the edit, and it cannot — there is
// nothing to block by the time this runs. `npm run lint` and CI remain the actual
// gate; this only shortens the feedback loop from "next lint run" to "the next thing
// the agent reads". Do not describe this hook, in code or in conversation, as
// blocking a bad edit — it corrects one already made.
//
// Fails CLOSED on an unparseable payload, the same direction as guard-ruleset.ts and
// for the same reason: a hook that cannot read its input cannot vouch for the write.
// It fails OPEN — silent, exit 0 — on any path outside frontend/src/ or that is not a
// .ts or .html file, the same direction as angular-service-guide.ts: it protects
// nothing there, and firing anyway would nag every other edit in the repo.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ESLint } from 'eslint';
import { logFiring } from './_hook-log.ts';
import { docPointerBlock } from './rule-docs.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = join(ROOT, 'frontend', 'eslint.config.mjs');

/** True when the path is a frontend source file this hook lints. */
export function shouldLint(path: string | null | undefined): boolean {
  if (!path) return false;
  // Anchor on (^|/) so both relative ("frontend/...") and absolute paths match, since a
  // hook may receive either — the same normalization angular-service-guide.ts uses.
  const p = path.replace(/\\/g, '/');
  if (!/(^|\/)frontend\/src\//.test(p)) return false;
  return /\.(ts|html)$/.test(p);
}

/**
 * Lints one file with the jig ruleset and returns its ESLint messages.
 *
 * cwd is pinned to the repo ROOT to match `npm run lint`. Per the comment at the top
 * of frontend/eslint.config.mjs: ESLint 9 resolves a flat config's basePath — and
 * therefore every root-relative `ignores` pattern in that config — from the cwd it is
 * given when a config file is passed explicitly, not from the config file's own
 * directory. Passing any other cwd here would silently stop honoring those ignores.
 */
export async function lintFile(absPath: string) {
  const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: CONFIG_PATH });
  const [result] = await eslint.lintFiles([absPath]);
  return result?.messages ?? [];
}

function formatMessages(messages: { line: number; column: number; message: string; ruleId: string | null }[]) {
  return messages
    .map((m) => `  ${m.line}:${m.column}  ${m.message}${m.ruleId ? `  (${m.ruleId})` : ''}`)
    .join('\n');
}

async function main() {
  let path = '';
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    path = input?.tool_input?.file_path ?? '';
  } catch {
    console.error(
      'check-frontend: could not parse the hook payload from stdin; failing closed.',
    );
    process.exit(2);
  }

  if (!shouldLint(path)) process.exit(0);

  const absPath = resolve(ROOT, path);
  const messages = await lintFile(absPath);
  if (messages.length === 0) process.exit(0);

  const ruleIds = messages.map((m) => m.ruleId).filter((id): id is string => Boolean(id));
  const relPath = relative(ROOT, absPath).replace(/\\/g, '/');
  logFiring('check-frontend', relPath, messages.length, ruleIds);

  const pointer = docPointerBlock(ruleIds);
  console.error(
    `check-frontend: ${messages.length} jig rule violation(s) in ${relPath}\n` +
      formatMessages(messages) +
      (pointer ? `\n${pointer}` : '') +
      '\n\nThis edit already landed — this hook is corrective, not preventive. Fix the file above.',
  );
  process.exit(2);
}

// Only read stdin when run as the hook, so importing this module for tests does not block.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
