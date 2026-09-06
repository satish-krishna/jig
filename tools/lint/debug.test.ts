import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = join(ROOT, 'tools', 'lint', 'fixtures');
const CONFIG = join(ROOT, 'frontend', 'stylelint.config.mjs');

async function lint(fixture: string) {
  const result = await stylelint.lint({
    files: join(FIXTURES, fixture),
    configFile: CONFIG,
  });
  return result.results[0].warnings;
}

const warnings = await lint('spacing-dirty.css');
console.log('First warning:', JSON.stringify(warnings[0], null, 2));
console.log('All warning texts:');
warnings.forEach((w, i) => {
  console.log(`  [${i}] ${w.text}`);
});
