#!/usr/bin/env node
// PostToolUse guide: when a new Angular reusable unit is written, remind the agent to
// load the adding-an-angular-service skill and run discover-first before it builds on
// top of a capability that may already exist.
//
// This is a catch-net, not a gate. The skill triggers on its own description; this fires
// only when an agent went straight to writing a file without loading it. It nudges on
// Write (a new unit) and stays silent on Edit (an existing one, where discovery already
// happened), so it does not nag an iteration loop. It never blocks — the reminder rides
// in as additional context, and a missed reminder costs nothing the catalog gate does
// not already catch.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** True when the path is a newly written Angular reusable unit worth a discover-first nudge. */
export function isReusableUnit(path) {
  if (!path) return false;
  const p = path.replace(/\\/g, '/');
  if (p.endsWith('.spec.ts')) return false; // a test is not a new unit
  // Anchor on (^|/) so both relative ("frontend/...") and absolute paths match, since a
  // hook may receive either.
  if (/(^|\/)frontend\/src\/app\/.*\.(repository|service|transport)\.ts$/.test(p)) return true;
  if (/(^|\/)frontend\/src\/app\/capabilities\/.*\.ts$/.test(p)) return true;
  return false;
}

const REMINDER =
  'A new Angular reusable unit was just written. Before building on it, load the ' +
  'adding-an-angular-service skill and run discover-first: read .bob/registry/CATALOG.md, ' +
  'LSP workspace/symbol search for the concept, reuse or extend before creating, annotate ' +
  'the new unit with @capability, and run npm run catalog. Confirm it is in the right layer ' +
  '(repository vs capability vs feature service) and crosses no seam (a repository injects ' +
  'the Transport port, never a concrete wire; isTauri() lives only in provide-transport.ts).';

function main() {
  let path = '';
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    path = input?.tool_input?.file_path ?? '';
  } catch {
    process.exit(0); // never interfere with a tool call over malformed input
  }

  if (!isReusableUnit(path)) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: REMINDER },
    }),
  );
  process.exit(0);
}

// Run only when invoked as the hook; importing this for tests must not read stdin.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
