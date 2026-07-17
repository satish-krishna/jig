#!/usr/bin/env node
// PreToolUse guard: the architecture ruleset and its wiring are law, not code.
//
// A model that cannot get its code past a rule will sometimes edit the rule instead.
// Exit 2 denies the tool call outright and hands the message back, rather than
// complaining after the write has landed.
//
// This closes one door and is honest about the rest: deletion is neither Write nor
// Edit, so `rm` walks straight past this. DR0002 covers a deleted ruleset from inside
// the compiler; CI and the diff cover the rest. See ADR 0009.

import { readFileSync } from 'node:fs';

const GUARDED = [
  /tools[\\/]analyzers[\\/]/i,
  /tools[\\/]hooks[\\/]guard-ruleset\.mjs$/i,
  /services[\\/]api[\\/]src[\\/]Directory\.Build\.props$/i,
  /\.claude[\\/]settings\.json$/i,
];

/** True when a write to this path must be denied. */
export function guardedPath(path) {
  if (!path) return false;
  return GUARDED.some((pattern) => pattern.test(path));
}

function main() {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const path = input?.tool_input?.file_path ?? '';

  if (!guardedPath(path)) process.exit(0);

  console.error(
    `Denied: ${path} is architecture ruleset, guarded by ADR 0009.\n` +
      `Fix the code the analyzer flagged, not the rule that flagged it.\n` +
      `If the rule is genuinely wrong, say so and let a human change it in a reviewed diff.`,
  );
  process.exit(2);
}

// Only read stdin when run as the hook, so importing this for tests does not block.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
