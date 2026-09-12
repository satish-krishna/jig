/**
 * Generates a static "mini storybook": one screenshot per showcase component
 * page, assembled into docs/showcase/README.md with the images inline.
 *
 * Why this is generated rather than hand-written: `npm run ui:style` deletes
 * and regenerates `frontend/libs/ui` wholesale (see tools/ui-style), so a
 * hand-maintained screenshot doc would be silently false the first time
 * anyone switches the spartan style. The slug list itself is also derived —
 * see parsePageRoutes below — rather than restated, for the same reason
 * page-loaders.ts gives for being the only record of which pages exist.
 *
 * Run via `npm run showcase:shots`. It boots the frontend dev server if one
 * is not already listening on :4200 (and shuts it down again when done),
 * drives a headless Chromium through every showcase page, and scrapes each
 * page's own heading and usage notes rather than inventing prose — a second
 * hand-written description would be exactly the drift this tool exists to
 * avoid.
 */
import { createRequire } from 'node:module';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FRONTEND = 'frontend';
const PAGE_LOADERS = join(FRONTEND, 'src', 'app', 'showcase', 'page-loaders.ts');
const OUT_DIR = join('docs', 'showcase');
const IMAGES_DIR = join(OUT_DIR, 'images');
const README = join(OUT_DIR, 'README.md');
const BASE_URL = 'http://localhost:4200';

const VIEWPORT = { width: 1280, height: 900 } as const;

/** Slugs whose page renders its content in a portal that does not exist until
 *  triggered (a dialog, menu, tooltip, ...). Named once, for the caveat in the
 *  generated doc — the capture itself needs no per-slug branch, since it never
 *  tries to open anything. */
const PORTAL_COMPONENTS: readonly string[] = [
  'dialog',
  'sheet',
  'drawer',
  'popover',
  'tooltip',
  'dropdown-menu',
  'context-menu',
  'alert-dialog',
  'hover-card',
  'command',
  'combobox',
];

export interface PageEntry {
  readonly category: string;
  readonly slug: string;
}

/**
 * Parses page-loaders.ts for its `// Category` comments and `path: '<slug>'`
 * entries, in file order. page-loaders.ts's own doc comment calls itself "the
 * only record of which pages exist" — mirroring that list by hand here would
 * be exactly the drift this generator exists to avoid.
 *
 * Exported so the parsing logic is pinned by a test without a live server.
 */
export function parsePageRoutes(src: string): PageEntry[] {
  const entries: PageEntry[] = [];
  let category = '';

  for (const line of src.split('\n')) {
    const pathMatch = line.match(/path:\s*'([^']+)'/);
    if (pathMatch) {
      entries.push({ category, slug: pathMatch[1] });
      continue;
    }
    // Only a whole-line comment starts a new category — a trailing comment on
    // a code line must not be mistaken for one.
    const categoryMatch = line.match(/^\s*\/\/\s*(.+?)\s*$/);
    if (categoryMatch) category = categoryMatch[1];
  }
  return entries;
}

export interface UsageNote {
  readonly title: string;
  readonly note: string | null;
}

export interface PageCapture {
  readonly category: string;
  readonly slug: string;
  readonly heading: string;
  readonly usages: readonly UsageNote[];
}

export interface RenderOptions {
  readonly command: string;
  readonly portalSlugs: readonly string[];
}

const anchor = (slug: string) => `<a id="${slug}"></a>`;

/**
 * Renders the captured pages into the storybook markdown. Pure — no file
 * system, no network — so it is testable without a browser.
 *
 * Each section gets an explicit `<a id>` rather than relying on GitHub's own
 * heading-to-anchor slugification: the heading text carries a display name
 * AND a slug, and getting that algorithm exactly right ourselves is a second
 * fact to keep in sync for no benefit — an explicit id is simply correct.
 */
export function renderReadme(pages: readonly PageCapture[], options: RenderOptions): string {
  const categories: string[] = [];
  for (const p of pages) if (!categories.includes(p.category)) categories.push(p.category);

  const toc = categories
    .map((category) => {
      const items = pages
        .filter((p) => p.category === category)
        .map((p) => `- [${p.heading}](#${p.slug})`)
        .join('\n');
      return `### ${category}\n\n${items}`;
    })
    .join('\n\n');

  const sections = pages
    .map((p) => {
      const usageLines = p.usages.length
        ? p.usages
            .map((u) => (u.note ? `- **${u.title}** — ${u.note}` : `- **${u.title}**`))
            .join('\n')
        : '- No usages on this page.';
      return [
        anchor(p.slug),
        `## ${p.heading} — \`${p.slug}\``,
        '',
        `![${p.heading}](images/${p.slug}.png)`,
        '',
        usageLines,
      ].join('\n');
    })
    .join('\n\n');

  return `# Showcase mini storybook

GENERATED by \`tools/showcase-shots/showcase-shots.ts\` — do not edit. Run \`${options.command}\` to regenerate.

\`frontend/libs/ui\` is deleted and regenerated wholesale by \`npm run ui:style\`, so a hand-written version of this document would be silently false the first time anyone switches the spartan style. The descriptions below are scraped from each page's own heading and usage notes, not authored a second time here.

Overlay-based components (${options.portalSlugs.join(', ')}) render their content in a portal that does not exist in the DOM until triggered. Their screenshots below show the trigger only, never the opened state.

## Contents

${toc}

${sections}
`;
}

// ---------------------------------------------------------------------------
// Capture (Playwright, a live server) — not exercised by the unit tests above.
// ---------------------------------------------------------------------------

/** The slice of the Playwright API this generator uses, typed locally so
 *  `npm run typecheck` never has to resolve @playwright/test's own types —
 *  the package lives only in frontend/node_modules, not the root. */
interface PwPage {
  addInitScript(fn: () => void): Promise<void>;
  emulateMedia(options: { colorScheme?: string; reducedMotion?: string }): Promise<void>;
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>;
  addStyleTag(options: { content: string }): Promise<unknown>;
  evaluate<T>(fn: () => T): Promise<T>;
  screenshot(options: { path: string; fullPage?: boolean }): Promise<Buffer>;
  close(): Promise<void>;
}
interface PwBrowser {
  newPage(options?: {
    viewport?: { width: number; height: number };
    deviceScaleFactor?: number;
  }): Promise<PwPage>;
  close(): Promise<void>;
}
interface PwModule {
  chromium: { launch(options?: { headless?: boolean }): Promise<PwBrowser> };
}

function loadPlaywright(): PwModule {
  const require = createRequire(join(process.cwd(), FRONTEND, 'package.json'));
  return require('@playwright/test') as PwModule;
}

async function probeServer(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

async function waitForServer(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeServer(url, 2000)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function killTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  } else {
    child.kill('SIGTERM');
  }
}

interface ManagedServer {
  close(): void;
}

/** Reuses a dev server already listening on :4200; otherwise spawns
 *  `npm run start` in frontend/ and waits for it, same as playwright.config.ts
 *  does for the e2e suite. */
async function ensureServer(): Promise<ManagedServer> {
  if (await probeServer(BASE_URL, 1500)) {
    console.log(`Reusing dev server already listening on ${BASE_URL}.`);
    return { close: () => {} };
  }

  console.log('No dev server found — starting `npm run start` in frontend/ ...');
  // The whole command as one string, not `spawn('npm', ['run', 'start'], { shell: true })`:
  // Node warns (DEP0190) that shell:true with a separate args array concatenates them
  // unescaped, and there is nothing here worth quoting anyway.
  const child = spawn('npm run start', {
    cwd: FRONTEND,
    shell: true,
    stdio: 'ignore',
  });

  const up = await waitForServer(BASE_URL, 120_000);
  if (!up) {
    killTree(child);
    throw new Error(`Frontend dev server did not become ready on ${BASE_URL} within 120s.`);
  }
  console.log('Dev server ready.');
  return { close: () => killTree(child) };
}

function directorySize(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((total, name) => total + statSync(join(dir, name)).size, 0);
}

async function capturePage(page: PwPage, entry: PageEntry): Promise<PageCapture> {
  await page.goto(`${BASE_URL}/showcase/${entry.slug}`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForSelector('h1', { timeout: 15_000 });

  // Belt and suspenders on top of the localStorage init script: force light
  // and strip any transition/animation so re-runs are byte-stable diffs.
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }`,
  });

  const scraped = await page.evaluate(() => {
    const heading = document.querySelector('h1')?.textContent?.trim() ?? '';
    const usages = Array.from(document.querySelectorAll('app-usage')).map((el) => ({
      title: el.querySelector('h3')?.textContent?.trim() ?? '',
      note: el.querySelector('header p')?.textContent?.trim() || null,
    }));
    return { heading, usages };
  });

  mkdirSync(IMAGES_DIR, { recursive: true });
  await page.screenshot({ path: join(IMAGES_DIR, `${entry.slug}.png`), fullPage: true });

  return { category: entry.category, slug: entry.slug, heading: scraped.heading, usages: scraped.usages };
}

async function main(): Promise<void> {
  const pages = parsePageRoutes(readFileSync(PAGE_LOADERS, 'utf8'));
  if (!pages.length) throw new Error(`No pages found in ${PAGE_LOADERS}`);

  // Stale images from a slug that no longer exists would sit there silently
  // true-looking; wipe before regenerating, same as ui-style.ts does for libs/ui.
  rmSync(IMAGES_DIR, { recursive: true, force: true });
  mkdirSync(IMAGES_DIR, { recursive: true });

  const server = await ensureServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });

  try {
    const browserPage = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    // Applies before every navigation on this page instance, including the
    // first — forces light before the app's ThemeService ever reads storage.
    await browserPage.addInitScript(() => {
      try {
        window.localStorage.setItem('jig.theme', 'light');
      } catch {
        /* best-effort, same as ThemeService itself */
      }
    });
    await browserPage.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });

    const captures: PageCapture[] = [];
    for (const entry of pages) {
      console.log(`Capturing ${entry.slug} ...`);
      captures.push(await capturePage(browserPage, entry));
    }
    await browserPage.close();

    const markdown = renderReadme(captures, {
      command: 'npm run showcase:shots',
      portalSlugs: PORTAL_COMPONENTS,
    });
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(README, markdown, 'utf8');

    const bytes = directorySize(IMAGES_DIR);
    console.log(
      `Wrote ${captures.length} screenshots and ${README} (images: ${(bytes / 1024 / 1024).toFixed(2)} MiB).`,
    );
  } finally {
    await browser.close();
    server.close();
  }
}

// endsWith, not includes: `includes('showcase-shots')` also matches
// showcase-shots.test.ts and would run the capture during the test suite.
if (process.argv[1]?.endsWith('showcase-shots.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
