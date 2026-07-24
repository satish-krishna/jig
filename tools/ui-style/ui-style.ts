/**
 * Switches the spartan style for the whole vendored component set.
 *
 * Why this is a command and not a runtime toggle: the six style files carry no
 * CSS variables. They are ~300 `.spartan-* { @apply ... }` rules that the CLI
 * resolves and INLINES into each component at generation time — nova emits
 * `h-8` where vega emits `h-9`. Those are compiled Tailwind classes inside
 * libs/ui/*.ts, so nothing at runtime can rewrite them. Style is a build-time
 * property of the generated code. See ADR 0010.
 *
 * Why it deletes before regenerating: `ng g @spartan-ng/cli:ui` refuses to
 * touch an installed component ("Skipping ... It's already installed!"), so
 * re-running it after changing components.json is a no-op. The only way to
 * restyle is to remove the directories and let the generator re-emit them.
 *
 * That makes this destructive, so it refuses to run on a dirty working tree:
 * git is the undo button, and it only works if there is something to go back
 * to.
 *
 * Usage: npm run ui:style -- <nova|vega|lyra|maia|mira|luma> [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FRONTEND = 'frontend';
const COMPONENTS_JSON = join(FRONTEND, 'components.json');
const STYLE_DIR = join(
  FRONTEND,
  'node_modules',
  '@spartan-ng',
  'cli',
  'src',
  'generators',
  'ui',
);

export function availableStyles(styleDir = STYLE_DIR): string[] {
  return readdirSync(styleDir)
    .filter((f) => f.startsWith('style-') && f.endsWith('.css'))
    .map((f) => f.slice('style-'.length, -'.css'.length))
    .sort();
}

export function installedComponents(uiRoot = join(FRONTEND, 'libs', 'ui')): string[] {
  return readdirSync(uiRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Throws with a usable message rather than letting the CLI fail obscurely later. */
export function assertValidStyle(style: string | undefined, styles: string[]): asserts style is string {
  if (!style) {
    throw new Error(`No style given. Available: ${styles.join(', ')}`);
  }
  if (!styles.includes(style)) {
    throw new Error(`Unknown style '${style}'. Available: ${styles.join(', ')}`);
  }
}

export function isTreeClean(cwd = '.'): boolean {
  const out = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
  return out.trim() === '';
}

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const style = args.find((a) => !a.startsWith('--'));

  const styles = availableStyles();
  assertValidStyle(style, styles);

  const config = JSON.parse(readFileSync(COMPONENTS_JSON, 'utf8'));
  if (config.style === style && !dryRun) {
    console.log(`Already on '${style}'. Nothing to do.`);
    return;
  }

  const components = installedComponents();
  console.log(`Style: ${config.style} -> ${style}`);
  console.log(`Components to regenerate: ${components.length}`);

  if (dryRun) {
    console.log('--dry-run: nothing written.');
    return;
  }

  if (!isTreeClean()) {
    throw new Error(
      'Working tree is dirty. This deletes and regenerates every component in libs/ui, ' +
        'and git is the only way back. Commit or stash first.',
    );
  }

  config.style = style;
  writeFileSync(COMPONENTS_JSON, JSON.stringify(config, null, 2) + '\n');

  for (const component of components) {
    rmSync(join(FRONTEND, 'libs', 'ui', component), { recursive: true, force: true });
  }

  // Sequential on purpose: the generator rewrites tsconfig.json and
  // tsconfig.app.json on every run, so parallel invocations race on them.
  for (const [i, component] of components.entries()) {
    process.stdout.write(`  [${i + 1}/${components.length}] ${component}\n`);
    execFileSync('npx', ['ng', 'g', '@spartan-ng/cli:ui', `--name=${component}`], {
      cwd: FRONTEND,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
  }

  console.log('Regenerating the showcase API tables...');
  execFileSync('node', [join('tools', 'showcase-api', 'showcase-api.ts')], { stdio: 'inherit' });

  console.log(`\nDone. Now on '${style}'. Run \`npm run verify\` before committing.`);
}

// endsWith, not includes: `includes('ui-style')` also matches ui-style.test.ts,
// which would run the whole destructive main() during the test suite.
if (process.argv[1]?.endsWith('ui-style.ts')) {
  try {
    main();
  } catch (error) {
    console.error(`\n${(error as Error).message}`);
    process.exit(1);
  }
}
