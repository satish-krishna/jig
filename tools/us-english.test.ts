import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STEMS,
  ISE_VERB_STEMS,
  PATTERN_OVERRIDES,
  FILE_STEM_EXCEPTIONS,
  EXPECTED_FILE_STEM_EXCEPTIONS,
  CLEAN_EXAMPLES,
  DIRTY_EXAMPLES,
} from './us-english-stems.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The only file this gate does not scan. Its content is the word list
 * itself: the strings this gate checks for have to be spelled out somewhere
 * to be checked against, and that is data, not a violation. See its header
 * comment for the fuller rationale. Everything else — including this test
 * file — is scanned like any other tracked text file, so a hit written into
 * a comment here would be caught the same as a hit anywhere else.
 */
const EXCLUDED_FILES = new Set(['tools/us-english-stems.ts']);

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
    .filter((path) => !EXCLUDED_FILES.has(path));
}

/**
 * Case-sensitive matching, not `/gi`. A case-insensitive stem also matches
 * a camelCase identifier wherever the stem happens to straddle a word
 * boundary: an interior capital is real information — it marks a join
 * between two unrelated word fragments, not a spelling of the banned
 * form — and a case-insensitive match throws that information away.
 * Matching the lowercase stem plus one explicit capitalized-first-letter
 * variant (the only capitalization real prose uses: mid-sentence, or
 * capitalized at the start of a sentence) keeps every real hit while
 * rejecting any camelCase join whose capital falls inside the stem rather
 * than at its very first letter. A capital exactly at the first letter is
 * not a false positive: that camelCase identifier really does spell the
 * banned word, so it stays caught.
 *
 * `ISE_VERB_STEMS` additionally require one of "a", "e", "i" immediately
 * after the stem, because those stems are prefixes of real inflections
 * and, without that check, also match the first letters of an unrelated,
 * correctly spelled word that continues differently. `PATTERN_OVERRIDES`
 * covers the remaining, one-off cases the same two mechanisms above do
 * not. The data module's header comments and `CLEAN_EXAMPLES`/
 * `DIRTY_EXAMPLES` below give the concrete pairs each of these protects.
 */
function patternFor(stem: string): RegExp {
  const override = PATTERN_OVERRIDES[stem];
  if (override) return override;

  const capitalized = stem[0].toUpperCase() + stem.slice(1);
  const continuation = ISE_VERB_STEMS.has(stem) ? '(?=[aei])' : '';
  return new RegExp(`(?:${stem}|${capitalized})${continuation}`, 'g');
}

interface Hit {
  file: string;
  stem: string;
  word: string;
  line: number;
}

/** Every stem hit in one string, ignoring file-scoped exceptions. */
function matchStemsIn(text: string): Array<{ stem: string; word: string }> {
  const hits: Array<{ stem: string; word: string }> = [];

  for (const stem of STEMS) {
    const matches = text.match(patternFor(stem));
    if (!matches) continue;
    for (const word of matches) hits.push({ stem, word });
  }

  return hits;
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

    lines.forEach((line, index) => {
      for (const { stem, word } of matchStemsIn(line)) {
        if (FILE_STEM_EXCEPTIONS.has(`${file}:${stem}`)) continue;
        hits.push({ file, stem, word, line: index + 1 });
      }
    });
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

/**
 * The exclusion is meant to stay pinned to the one file whose job requires
 * it. Widening it is the quiet way this kind of gate rots — a future editor
 * adds a second path "just for now" and the gate goes blind there forever.
 */
test('the scan excludes exactly one file — its own word-list data module', () => {
  assert.deepEqual([...EXCLUDED_FILES], ['tools/us-english-stems.ts']);
});

/**
 * Same rot-risk as the file exclusion above, same fix: pin the set so
 * widening it back to "just add another exception" is a visible, failing
 * change rather than a quiet one.
 */
test('the file+stem exception set holds exactly the one documented upstream quotation', () => {
  assert.deepEqual([...FILE_STEM_EXCEPTIONS], EXPECTED_FILE_STEM_EXCEPTIONS);
});

/**
 * The regression this class of bug produces: a stem that is also a correct
 * word's prefix, or that collides with a camelCase identifier once matched
 * case-insensitively. These are the exact cases raised in review — every
 * one of them must stay clean. Fixtures live in the data module because,
 * like the stems themselves, they have to spell out real examples to mean
 * anything.
 */
test('unrelated correctly spelled words and identifiers never match a stem', () => {
  for (const clean of CLEAN_EXAMPLES) {
    assert.deepEqual(matchStemsIn(clean), [], `expected no hit in "${clean}"`);
  }
});

/** The real British inflections the continuation check must not reject. */
test('every real British inflection still matches its stem', () => {
  for (const dirty of DIRTY_EXAMPLES) {
    assert.ok(matchStemsIn(dirty).length > 0, `expected a hit in "${dirty}"`);
  }
});
