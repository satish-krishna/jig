#!/usr/bin/env node
// PreToolUse guard: the architecture ruleset and its wiring are law, not code.
//
// A model that cannot get its code past a rule will sometimes edit the rule instead.
// Exit 2 denies the tool call outright and hands the message back, rather than
// complaining after the write has landed.
//
// The scope is the RULE, not the engine that enforces it. ArchLayers.txt decides what
// is legal; LayerDependencyAnalyzer.cs merely computes it, and it is ordinary code that
// has to stay editable — the first attempt at this guard covered the whole analyzer tree
// and immediately blocked its own bugfix. The engine is held by its own tests, which turn
// red the moment someone guts it, and by the diff. The rule has no such backstop, because
// weakening a rule leaves every test green. That asymmetry is the whole reason this file
// draws the line where it does.
//
// .claude/settings.json is deliberately NOT guarded, for the same reason the engine is not:
// it holds every hook, so guarding it taxed every legitimate hook change and blocked two in
// practice. An agent unregistering this guard from settings.json still shows in the diff and
// CI — the final guard, the one the whole design leans on for everything it cannot lock from
// inside the repo. This file still guards itself, because changing WHAT the guard protects is
// a policy change and should pass through a human, not an agent editing its own leash.
//
// This closes one door and is honest about the rest: deletion is neither Write nor Edit,
// so `rm` walks straight past this. DR0002 covers a deleted ruleset from inside the
// compiler; CI and the diff cover the rest. See ADR 0009.

import { readFileSync } from 'node:fs';

const GUARDED = [
  /ArchLayers\.txt$/i,
  /tools[\\/]hooks[\\/]guard-ruleset\.mjs$/i,
  /services[\\/]api[\\/]src[\\/]Directory\.Build\.props$/i,
];

/** True when a write to this path must be denied. */
export function guardedPath(path) {
  if (!path) return false;
  return GUARDED.some((pattern) => pattern.test(path));
}

function main() {
  let path = '';
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    path = input?.tool_input?.file_path ?? '';
  } catch {
    // A guard that cannot read its input cannot vouch for the write, so it fails CLOSED:
    // deny with a clear message rather than throwing an exit-1 stack trace, which Claude
    // Code treats as non-blocking and would let the write through. This is the opposite of
    // the angular-service-guide nudge, which fails open (silent) because it protects
    // nothing — a guard and a nudge fail in opposite directions on purpose.
    console.error(
      'guard-ruleset: could not parse the hook payload from stdin; denying the tool call to fail closed.',
    );
    process.exit(2);
  }

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
