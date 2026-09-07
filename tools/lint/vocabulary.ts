import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseUtility } from './ast.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GENERATED = join(
  ROOT, 'frontend', 'src', 'app', 'showcase', 'component-api.generated.ts',
);
const LIBS_UI = join(ROOT, 'frontend', 'libs', 'ui');

/**
 * The installed primitive vocabulary, read from the file tools/showcase-api
 * already generates from libs/ui and npm run verify already checks for freshness.
 * No second generator: a hand-written table of primitive names would rot the
 * first time spartan is upgraded or the style is switched.
 */
let cache = null;

/**
 * Splits one selector string into the individual names it declares, sorting
 * each into `attributes` or `elements` as it goes. Shared by the generated-API
 * reader below and by the appearance-family deriver further down, which reads
 * selectors out of raw libs/ui source instead — same shape, same split.
 */
function classifySelectorParts(selectorString, attributes, elements) {
  // A selector is a comma-separated list, and a single primitive may declare
  // BOTH forms: "[hlmAccordion], hlm-accordion". Split first, classify each.
  for (const raw of selectorString.split(',')) {
    const part = raw.trim();
    if (part === '') continue;

    // "button[hlmAlertDialogAction]" is an attribute directive restricted to a
    // tag. The attribute is what a template author writes, so take that and
    // discard the tag qualifier.
    const attr = /\[([A-Za-z][\w-]*)\]/.exec(part);
    if (attr !== null) {
      attributes.add(attr[1]);
      continue;
    }
    if (/^hlm-[\w-]+$/.test(part)) elements.add(part);
  }
}

/** Every name (attribute or element form) one selector string declares. */
function selectorNamesOf(selectorString) {
  const attributes = new Set();
  const elements = new Set();
  classifySelectorParts(selectorString, attributes, elements);
  return [...attributes, ...elements];
}

function selectors() {
  if (cache !== null) return cache;

  const src = readFileSync(GENERATED, 'utf8');
  const attributes = new Set();
  const elements = new Set();

  for (const match of src.matchAll(/"selector":\s*"([^"]+)"/g)) {
    classifySelectorParts(match[1], attributes, elements);
  }

  cache = { attributes, elements };
  return cache;
}

export const attributeSelectors = () => selectors().attributes;
export const elementSelectors = () => selectors().elements;

/**
 * Native element to the primitives that satisfy it. This is the one hand-written
 * part of the vocabulary, and it stays small because it changes when HTML changes,
 * which is to say never.
 *
 * Several entries list more than one primitive because several helm directives
 * style the same native element in different compositions: <button hlmBtn> and
 * <button hlmSidebarMenuButton> are both acceptable buttons. Any ONE of them
 * satisfies the rule.
 *
 * Deliberately narrowed to controls, not typography. Three reasons:
 *
 * 1. The reference rule this is ported from defines its own scope as "a native
 *    CONTROL element used where a spartan primitive exists." Headings,
 *    paragraphs, and lists are not controls.
 * 2. A bare <button> is always wrong: unstyled and unwired to anything. A bare
 *    <p> is always fine: it inherits body styling and is exactly what a
 *    paragraph should be. The two do not share a predicate, so they cannot
 *    share a rule.
 * 3. Measured against the app: the wider map (with headings, <p>, <ul>,
 *    <blockquote>, <code>, <label>) caught 97 bare occurrences, 49 of them
 *    bare <p>. Sampling those 49 showed a handful of genuine hand-rolled
 *    primitives against dozens of plain showcase prose. Flagging all of it
 *    would bury a handful of real defects under dozens of false ones, and a
 *    rule that noisy is one people switch off.
 *
 * Within controls, each list below is exhaustive over every directive that
 * demonstrably renders its own visual styling onto that native tag — verified
 * per entry by reading the directive source for either a `classes()` call or a
 * `hostDirectives` entry composing the tag's base primitive (HlmButton,
 * HlmInput, or HlmTextarea). This matters because a compound component's own
 * child directive is frequently the only styling a control needs:
 * `<button hlmToggleGroupItem>` and `<button hlmTabsTrigger="...">` are both
 * fully styled with no `hlmBtn` alongside, the same way `<button hlmBtn>` is.
 * Wiring `no-raw-control` against the earlier, shorter lists (just hlmBtn and
 * a handful of siblings) flagged 145 elements, not the roughly 14 expected;
 * every extra hit traced back to one of these compound-component primitives
 * being absent from the map, not to an actual bare control. A directive that
 * only wires behaviour and carries no styling of its own — hlmDialogTrigger,
 * hlmDialogClose, hlmSheetTrigger, hlmSheetClose, hlmDrawerTrigger,
 * hlmDrawerClose, hlmCollapsibleTrigger, hlmPopoverTrigger,
 * hlmAlertDialogTrigger — is deliberately excluded: those are always paired
 * with hlmBtn in this codebase today (see dialog.page.ts, alert-dialog.page.ts),
 * and a bare `<button hlmDialogTrigger>` alone is a real, uncaught violation,
 * not a false positive.
 *
 * hlmCommandItem and hlmCarouselNext/hlmCarouselPrevious each declare a second,
 * kebab-case selector alias (`button[hlmCommandItem],button[hlm-command-item]`)
 * that this codebase's showcase actually uses, so both spellings of the same
 * directive are listed; leaving either out reproduces the same false positive
 * as leaving out a whole directive.
 */
export const NATIVE_TO_PRIMITIVE = {
  button: [
    'hlmBtn', 'hlmSidebarMenuButton', 'hlmToggle', 'hlmPaginationLink',
    'hlmToggleGroupItem', 'hlmTabsTrigger', 'hlmDropdownMenuItem', 'hlmDropdownMenuCheckbox',
    'hlmDropdownMenuRadio', 'hlmDropdownMenuSubTrigger', 'hlmMenubarTrigger', 'hlmNavigationMenuTrigger',
    'hlmAlertDialogAction', 'hlmAlertDialogCancel', 'hlmSidebarGroupAction', 'hlmSidebarMenuAction',
    'hlmSidebarMenuSubButton', 'hlmSidebarGroupLabel', 'hlmSidebarRail', 'hlmCommandItem', 'hlm-command-item',
    'hlmComboboxChipRemove', 'hlmCarouselNext', 'hlm-carousel-next', 'hlmCarouselPrevious', 'hlm-carousel-previous',
    'hlmInputGroupButton',
  ],
  input: ['hlmInput', 'hlmInputGroupInput', 'hlmComboboxChipInput', 'hlmSidebarInput'],
  textarea: ['hlmTextarea', 'hlmInputGroupTextarea'],
  table: ['hlmTable'],
};

/**
 * The four appearance families no-appearance-on-primitive governs. Kept as a
 * union rather than a free string so a typo in a family name fails the
 * type-check gate instead of silently matching nothing.
 */
export type AppearanceFamily = 'colour' | 'typography' | 'decoration' | 'padding';

// text-left / text-center / text-right / text-justify / text-start / text-end
// are alignment (layout), not typography, the same exemption
// no-appearance-on-primitive already carried before this file grew a classifier.
const ALIGNMENT = new Set(['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end']);

// The named steps of Tailwind's default text-size scale. An arbitrary size
// (`text-[2rem]`) or the CSS type-hinted form (`text-[length:...]`) is also
// typography, but the type hint embeds a colon INSIDE its brackets, which
// defeats baseUtility's "strip at the last colon" prefix rule — see the
// comment on appearanceFamilyOf below for why that is a known, accepted gap
// rather than a bug to chase here.
const TEXT_SIZE = new Set([
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
  'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl',
]);

const DECORATION_PATTERNS = [/^border$/, /^border-/, /^rounded$/, /^rounded-/, /^shadow$/, /^shadow-/, /^ring$/, /^ring-/];
const PADDING_PATTERNS = [/^p[xytblre]?-/];
const TYPOGRAPHY_PATTERNS = [/^font-/, /^leading-/, /^tracking-/];

/**
 * Classifies one Tailwind utility into the appearance family it belongs to, or
 * null when it is layout (or alignment, which reads as `text-*` but is
 * positional). This is the ONE classifier used on both sides of
 * no-appearance-on-primitive's comparison: it decides what a primitive's own
 * `classes()` literal sets (below) and what a call-site class is asking to
 * override, so the two sides can never silently disagree on what a family means.
 *
 * Known gap: `text-[length:--spacing(4)]`-style CSS type-hinted arbitrary
 * values embed a colon inside their own brackets, which defeats the
 * strip-at-the-last-colon prefix rule baseUtility uses for responsive/state
 * variants (`dark:sm:bg-red-500`). Such a token is misread and classified as
 * null (no family) rather than typography. This under-counts rather than
 * over-counts — it can only make a primitive look like it sets LESS than it
 * really does, never more — so it cannot manufacture a false violation. It is
 * exactly why hlm-spinner's own text-size is handled as the documented
 * exception in no-appearance-on-primitive.ts rather than relied on here.
 */
export function appearanceFamilyOf(cls) {
  const u = baseUtility(cls);

  if (u.startsWith('text-')) {
    if (ALIGNMENT.has(u)) return null;
    if (TEXT_SIZE.has(u)) return 'typography';
    return 'colour';
  }
  if (u.startsWith('bg-')) return 'colour';
  if (TYPOGRAPHY_PATTERNS.some((re) => re.test(u))) return 'typography';
  if (DECORATION_PATTERNS.some((re) => re.test(u))) return 'decoration';
  if (PADDING_PATTERNS.some((re) => re.test(u))) return 'padding';
  return null;
}

/**
 * From an opening '(' at text[openIdx], returns the text through its matching
 * ')', treating quoted string contents as opaque so a Tailwind arbitrary value
 * like `aspect-(--ratio)` or `text-[length:--spacing(4)]` inside a class
 * string never miscounts as a real paren.
 */
function extractBalancedParen(text, openIdx) {
  let depth = 0;
  let inString = null;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (inString !== null) {
      if (ch === '\\') { i++; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return text.slice(openIdx, i + 1);
    }
  }
  return text.slice(openIdx);
}

const STRING_LITERAL = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g;

/** The contents (quotes stripped) of every string literal in a chunk of source. */
function literalsIn(text) {
  return [...text.matchAll(STRING_LITERAL)].map((m) => m[0].slice(1, -1));
}

function walkTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(path));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * The primitive vocabulary's appearance side: for each selector name, the set
 * of appearance families its OWN `classes()` call actually renders, derived
 * from libs/ui source rather than hand-maintained (the whole point — see
 * no-appearance-on-primitive.ts). Two directives compose a `cva()` variants
 * function rather than writing a class string directly (hlmBtn, hlmBadge, ...);
 * a `cva('base', { variants: {...} })` call's base string and every variant's
 * string are pooled together, because any of them may render depending on the
 * input the call site never controls — this rule only needs to know whether a
 * family is EVER possible, not which variant is active.
 */
let familyCache = null;

function deriveAppearanceFamilies() {
  if (familyCache !== null) return familyCache;

  const files = walkTsFiles(LIBS_UI);
  const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

  // Pass 1: every `const NAME = cva(...)` (locally, per file) and globally, so
  // a directive that imports another module's variants function (e.g.
  // hlmComboboxChipRemove composing buttonVariants) still resolves.
  const globalCva = new Map();
  const localCva = new Map();
  for (const [file, src] of sources) {
    const perFile = new Map();
    for (const match of src.matchAll(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*cva\(/g)) {
      const name = match[1];
      const openIdx = match.index + match[0].length - 1;
      const literals = literalsIn(extractBalancedParen(src, openIdx));
      perFile.set(name, literals);
      if (!globalCva.has(name)) globalCva.set(name, literals);
    }
    localCva.set(file, perFile);
  }

  // Pass 2: every selector, and every `classes(...)` call attributed to the
  // nearest PRECEDING selector in the same file — true for every directive in
  // libs/ui today, one class body (decorator, then constructor) at a time.
  const pool = new Map(); // raw selector string -> Set<string> of pooled class-list literals

  for (const [file, src] of sources) {
    const selectorHits = [...src.matchAll(/selector:\s*'([^']*)'/g)]
      .map((m) => ({ pos: m.index, value: m[1] }));
    if (selectorHits.length === 0) continue;

    const perFileCva = localCva.get(file);

    for (const call of src.matchAll(/\bclasses\(/g)) {
      const openIdx = call.index + call[0].length - 1;
      const callText = extractBalancedParen(src, openIdx);

      let current = null;
      for (const hit of selectorHits) {
        if (hit.pos <= call.index) current = hit;
        else break;
      }
      if (current === null) continue;

      const literals = literalsIn(callText);
      for (const [name, ident] of callText.matchAll(/([A-Za-z_$][\w$]*)\(/g)) {
        const resolved = perFileCva.get(ident) ?? globalCva.get(ident);
        if (resolved !== undefined) literals.push(...resolved);
      }

      const bucket = pool.get(current.value) ?? new Set();
      for (const literal of literals) bucket.add(literal);
      pool.set(current.value, bucket);
    }
  }

  // Pass 3: classify every pooled literal's tokens into families, and fan the
  // per-selector-string result out to every name that selector string declares.
  const families = new Map();
  for (const [selectorString, literals] of pool) {
    const set = new Set();
    for (const literal of literals) {
      for (const token of literal.split(/\s+/).filter(Boolean)) {
        const family = appearanceFamilyOf(token);
        if (family !== null) set.add(family);
      }
    }
    for (const name of selectorNamesOf(selectorString)) {
      const existing = families.get(name) ?? new Set();
      for (const family of set) existing.add(family);
      families.set(name, existing);
    }
  }

  familyCache = families;
  return familyCache;
}

/** The appearance families the named primitive's own styling actually sets. */
export function appearanceFamiliesOf(name) {
  return deriveAppearanceFamilies().get(name) ?? new Set();
}
