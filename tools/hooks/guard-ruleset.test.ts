import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { guardedPath, guardedCommand } from './guard-ruleset.ts';

const HOOK = fileURLToPath(new URL('./guard-ruleset.ts', import.meta.url));
const run = (stdin: string) =>
  spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8' });

test('guards the layer map', () => {
  assert.equal(guardedPath('D:\\Repos\\jig\\tools\\analyzers\\Jig.Analyzers\\ArchLayers.txt'), true);
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/ArchLayers.txt'), true);
});

test('leaves the analyzer engine editable', () => {
  // The rule is guarded; the engine that computes it is not. Weakening ArchLayers.txt
  // leaves every test green, so it needs a gate. Gutting the analyzer turns its own
  // tests red, so it does not — and guarding it once blocked its own bugfix.
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/LayerDependencyAnalyzer.cs'), false);
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/LayerRule.cs'), false);
  assert.equal(guardedPath('D:\\Repos\\jig\\tools\\analyzers\\Jig.Analyzers.Tests\\LayerRuleTests.cs'), false);
});

test('guards the wiring and the guard itself', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Directory.Build.props'), true);
  assert.equal(guardedPath('/repos/jig/tools/hooks/guard-ruleset.ts'), true);
});

test('leaves .claude/settings.json editable', () => {
  // settings.json holds every hook, so guarding it taxed every legitimate hook change
  // and blocked two of them in practice. Unregistering the guard from settings.json
  // still shows in the diff and CI — the same backstop that protects the analyzer engine
  // and everything else that cannot be locked from inside the repo. Guarding it bought
  // little and cost a hand-apply on every hook edit forever.
  assert.equal(guardedPath('/repos/jig/.claude/settings.json'), false);
  assert.equal(guardedPath('D:\\Repos\\jig\\.claude\\settings.json'), false);
});

test('leaves ordinary source alone', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Jig.Api/Users/GetUserEndpoint.cs'), false);
  assert.equal(guardedPath('/repos/jig/frontend/src/app/repositories/user.repository.ts'), false);
  assert.equal(guardedPath(''), false);
});

test('end to end: denies a guarded path, allows an ordinary one', () => {
  assert.equal(run(JSON.stringify({ tool_input: { file_path: 'x/ArchLayers.txt' } })).status, 2);
  assert.equal(run(JSON.stringify({ tool_input: { file_path: 'x/user.repository.ts' } })).status, 0);
});

test('fails closed on malformed or empty stdin', () => {
  // A guard that cannot read its input denies rather than throwing an exit-1 stack trace,
  // which Claude Code treats as non-blocking and would let the write through.
  const malformed = run('not json');
  assert.equal(malformed.status, 2);
  assert.match(malformed.stderr, /could not parse/i);
  assert.equal(run('').status, 2);
});

// --- Bash bypass ---------------------------------------------------------
//
// The guard matched Write|Edit only, so `sed -i` walked straight past it. That
// was found the hard way: an agent renamed this very file and rewrote its own
// GUARDED list with sed, and the guard never fired — it only objected when the
// Edit tool was reached for afterwards.
//
// Reading a guarded file stays allowed. Only a command that would MUTATE one is
// denied, so `cat ArchLayers.txt` and `grep Api ArchLayers.txt` keep working.

test('denies a bash command that would mutate a guarded file', () => {
  const denied = [
    "sed -i 's/Api/Web/' tools/analyzers/Jig.Analyzers/ArchLayers.txt",
    'echo "" > tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'cat extra >> tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'rm tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'mv tools/analyzers/Jig.Analyzers/ArchLayers.txt /tmp/gone.txt',
    'tee tools/analyzers/Jig.Analyzers/ArchLayers.txt < /dev/null',
    "sed -i 's/x/y/' tools/hooks/guard-ruleset.ts",
    'rm services/api/src/Directory.Build.props',
  ];

  for (const command of denied) {
    assert.equal(guardedCommand(command), true, `should deny: ${command}`);
  }
});

test('allows a bash command that only reads a guarded file', () => {
  const allowed = [
    'cat tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'grep Api tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'wc -l tools/analyzers/Jig.Analyzers/ArchLayers.txt',
    'npm run verify',
    'git status --short',
    "sed -i 's/a/b/' README.md",
    'rm -rf frontend/dist',
  ];

  for (const command of allowed) {
    assert.equal(guardedCommand(command), false, `should allow: ${command}`);
  }
});

test('a mutator must TARGET the guarded file, not merely appear somewhere in the command', () => {
  // The first cut denied when a guarded name appeared anywhere and a mutating
  // character appeared anywhere, unrelated to each other. Since `>` counts as a
  // mutator, that denied pure reads: a stderr redirect, a grep piped to a scratch
  // file, even prose containing an angle bracket. It blocked its own author twice
  // within a minute of shipping, on read-only commands.
  //
  // A guard this noisy trains people to route around it, and a guard people route
  // around is the suppression dial ADR 0009 spent three pages refusing to build.
  const NAME = 'tools/analyzers/Jig.Analyzers/ArchLayers.txt';

  // Reads stay allowed even when the command contains a redirect elsewhere.
  assert.equal(guardedCommand(`grep Api ${NAME} > /tmp/out`), false);
  assert.equal(guardedCommand(`cat ${NAME} 2>&1`), false);
  assert.equal(guardedCommand(`echo 'jig/<name>' && cat ${NAME}`), false);
  assert.equal(guardedCommand(`sed -n '1,5p' ${NAME}`), false);

  // A mutation that actually targets the file is still denied.
  assert.equal(guardedCommand(`echo "" > ${NAME}`), true);
  assert.equal(guardedCommand(`cat x >> ${NAME}`), true);
  assert.equal(guardedCommand(`sed -i 's/a/b/' ${NAME}`), true);
  assert.equal(guardedCommand(`rm ${NAME}`), true);
  assert.equal(guardedCommand(`tee ${NAME} < /dev/null`), true);

  // A command separator breaks the span: a mutation of something else, followed
  // by a read of a guarded file, is two commands and only one of them matters.
  assert.equal(guardedCommand(`rm /tmp/scratch; cat ${NAME}`), false);
  assert.equal(guardedCommand(`echo hi > /tmp/x && grep Api ${NAME}`), false);
});

test('the self-guard pattern is exact, not a wildcard dot', () => {
  // The escape was lost in a sed once. `.` unescaped matches any character, so a
  // file named guard-rulesetXts would have been treated as the guard itself.
  assert.equal(guardedPath('/repos/jig/tools/hooks/guard-ruleset.ts'), true);
  assert.equal(guardedPath('/repos/jig/tools/hooks/guard-rulesetXts'), false);
});
