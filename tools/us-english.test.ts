import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'tools/us-english.test.ts';

/**
 * Stems, not whole words, so `colour` also catches `colours` and `coloured`
 * without a separate entry per inflection.
 *
 * `analyse`/`paralyse` — not the `analys`/`paralys` prefix — because `analys`
 * also matches the correctly spelled noun "analysis"/"analyses", whose US and
 * UK spelling is identical; only the verb forms (analyse/analyze) differ. A
 * prefix that flags a correct spelling gets suppressed, not fixed.
 *
 * This list is deliberately not exhaustive English-wide. It lists what this
 * repo has used or would plausibly reach for — see the sweep note on
 * `labell` below — because a word list nobody can read is a word list nobody
 * maintains.
 */
const STEMS = [
  'colour',
  'behaviour',
  'favour',
  'labour',
  'neighbour',
  'honour',
  'centre',
  'metre',
  'litre',
  'theatre',
  'initialis',
  'organis',
  'recognis',
  'customis',
  'optimis',
  'summaris',
  'prioritis',
  'utilis',
  'normalis',
  'serialis',
  'visualis',
  'authoris',
  'categoris',
  'apologis',
  'analyse',
  'paralyse',
  'licence',
  'defence',
  'offence',
  'pretence',
  'catalogue',
  'dialogue',
  'travelling',
  'cancelled',
  'modelling',
  // Confirmed present in this repo (aspect-ratio.page.ts, sonner.page.spec.ts,
  // component-registry.ts): "labelled"/"labelling". Other plausible British
  // forms swept for (grey, whilst, amongst, fulfil, enrol, skilful, practise,
  // programme, storey, manoeuvre, sceptic) do not occur anywhere in the tree,
  // so per the "only list what's actually used" rule above they are not added.
  'labell',
];

/**
 * Per-stem regex overrides for stems whose plain substring match produces a
 * false positive against a fixed, unrenamable API name.
 *
 * `labell` alone would also match inside `aria-labelledby` — the W3C ARIA
 * attribute name, emitted verbatim by
 * `frontend/src/app/showcase/component-api.generated.ts` (generated from the
 * vendored `frontend/libs/ui` sources, never hand-edited). That is correct
 * text, not a spelling bug, so the fix belongs in the pattern, not in an
 * exception list entry.
 */
const PATTERN_OVERRIDES: Record<string, RegExp> = {
  labell: /(?<!aria-)labell/gi,
};

/**
 * One narrow, named, and commented skip — the only kind Step 3 allows.
 *
 * `run.cancelled` (and its mention two lines later) is not this repo's
 * prose: it is a literal event name from Kata's published wire protocol, an
 * external, sibling project this design doc describes rather than owns
 * ("Both providers emit this exact protocol"). Renaming it to `run.canceled`
 * would make the doc wrong about what the upstream system actually emits.
 * Scoped to this one file and this one stem, not the whole document.
 */
const FILE_STEM_EXCEPTIONS = new Set([
  'docs/superpowers/specs/2026-07-03-agent-streaming-design.md:cancelled',
]);

/** Binary/asset extensions git tracks that are never worth text-scanning. */
const BINARY_EXT = new Set([
  '.png',
  '.ico',
  '.icns',
  '.thumbnail',
  '.jpg',
  '.jpeg',
  '.gif',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.zip',
]);

const LOCKFILE_NAMES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Cargo.lock']);

function extensionOf(path: string): string {
  const base = path.split('/').pop() ?? path;
  const i = base.lastIndexOf('.');
  return i <= 0 ? base : base.slice(i);
}

function trackedTextFiles(): string[] {
  const result = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ls-files failed: ${result.stderr}`);

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((path) => !path.startsWith('frontend/libs/'))
    .filter((path) => !LOCKFILE_NAMES.has(path.split('/').pop() ?? path))
    .filter((path) => !BINARY_EXT.has(extensionOf(path).toLowerCase()))
    // This file is the one legitimate exception: the STEMS list and the
    // comments explaining each stem's provenance must spell out the actual
    // British words verbatim, or a reader could not tell what the gate
    // checks for. That is data and documentation, not a spelling mistake.
    .filter((path) => path !== SELF);
}

interface Hit {
  file: string;
  stem: string;
  word: string;
  line: number;
}

function findHits(): Hit[] {
  const hits: Hit[] = [];

  for (const file of trackedTextFiles()) {
    // Read as utf8 explicitly: a NUL byte (tools/lint/vocabulary.ts uses one
    // as a string-masking character) is a normal Unicode code point to Node's
    // utf8 decoder, not an end-of-string marker or a "this is binary, skip
    // it" signal — unlike naive byte-sniffing tools such as grep.
    const content = readFileSync(join(ROOT, file), 'utf8');
    const lines = content.split('\n');

    for (const stem of STEMS) {
      const pattern = PATTERN_OVERRIDES[stem] ?? new RegExp(stem, 'gi');
      if (FILE_STEM_EXCEPTIONS.has(`${file}:${stem}`)) continue;

      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (!matches) return;
        for (const word of matches) {
          hits.push({ file, stem, word, line: index + 1 });
        }
      });
    }
  }

  return hits;
}

test('every tracked text file uses US English spelling', () => {
  const hits = findHits();

  assert.deepEqual(
    hits,
    [],
    `British spelling found — fix these to US English:\n${hits
      .map((h) => `  ${h.file}:${h.line} — "${h.word}" (stem: ${h.stem})`)
      .join('\n')}`,
  );
});
