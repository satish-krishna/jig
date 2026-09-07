import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STEMS, PATTERN_OVERRIDES, FILE_STEM_EXCEPTIONS } from './us-english-stems.ts';

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

/**
 * The exclusion is meant to stay pinned to the one file whose job requires
 * it. Widening it is the quiet way this kind of gate rots — a future editor
 * adds a second path "just for now" and the gate goes blind there forever.
 */
test('the scan excludes exactly one file — its own word-list data module', () => {
  assert.deepEqual([...EXCLUDED_FILES], ['tools/us-english-stems.ts']);
});
