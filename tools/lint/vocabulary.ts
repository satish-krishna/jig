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
 * only wires behavior and carries no styling of its own — hlmDialogTrigger,
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
export type AppearanceFamily = 'color' | 'typography' | 'decoration' | 'padding';

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
    return 'color';
  }
  if (u.startsWith('bg-')) return 'color';
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

const STRING_LITERAL = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

/** The contents (quotes stripped) of every string literal in a chunk of source. */
function literalsIn(text) {
  return [...text.matchAll(STRING_LITERAL)].map((m) => m[0].slice(1, -1));
}

/** True when `text` (already trimmed) is exactly one quoted string literal, start to end. */
function isWholeStringLiteral(text) {
  const matches = [...text.matchAll(STRING_LITERAL)];
  return matches.length === 1 && matches[0][0] === text;
}

/**
 * A same-length "mask" of `text`: a top-level character (depth 0, not inside a
 * quoted string) keeps its own value; anything nested inside `(`/`[`/`{` or
 * inside a string is replaced with NUL. Lets `splitTopLevel` and
 * `topLevelTernary` below find a real comma or `?`/`:` by position in `text`
 * without tripping on one buried inside a nested call's own arguments or a
 * Tailwind arbitrary value's brackets.
 */
function topLevelMask(text) {
  let depth = 0;
  let inString = null;
  let mask = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString !== null) {
      mask += ' ';
      if (ch === '\\') { i++; mask += ' '; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = ch; mask += ' '; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; mask += ' '; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; mask += ' '; continue; }
    mask += depth === 0 ? ch : ' ';
  }
  return mask;
}

/** Splits `text` on every top-level occurrence of `sep`, ignoring nested and quoted ones. */
function splitTopLevel(text, sep) {
  const mask = topLevelMask(text);
  const parts = [];
  let start = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === sep) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** The `{ cond, then, else }` of a top-level `cond ? then : else`, or null. */
function topLevelTernary(text) {
  const mask = topLevelMask(text);
  const q = mask.indexOf('?');
  if (q === -1) return null;
  const c = mask.indexOf(':', q + 1);
  if (c === -1) return null;
  return { then: text.slice(q + 1, c), else: text.slice(c + 1) };
}

/** The right-hand side of a top-level `cond && value`, or null. */
function topLevelAnd(text) {
  const mask = topLevelMask(text);
  const i = mask.indexOf('&&');
  if (i === -1) return null;
  return text.slice(i + 2);
}

/**
 * Strips `//` and `/* *\/` comments, leaving quoted string contents alone, so
 * an array element like `// separator classes\n'shrink-0 ...'` still reads as
 * a whole string literal once the comment ahead of it is gone.
 */
function stripComments(text) {
  let out = '';
  let inString = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString !== null) {
      out += ch;
      if (ch === '\\') { i++; if (i < text.length) out += text[i]; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = ch; out += ch; continue; }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Resolves one `classes(() => EXPR)` argument to the literal class strings it
 * can ever render, or marks it UNRESOLVED when `expr` is a shape this deriver
 * does not recognize. Three states, never conflated:
 *
 * - a shape it recognizes (literal, array, ternary, `&&`, cva() call,
 *   same-file plain-string const, a block-bodied arrow function swept for
 *   every literal it could return, or a `this.foo` / `this.foo()` runtime
 *   accessor) resolves to `{ literals, unresolved: false }` — `literals` may
 *   be empty (a `this._additionalClasses()` hook is genuinely dynamic and
 *   contributes nothing statically; that is a KNOWN empty result, not a guess).
 * - anything else — a fifth way of declaring classes this deriver was never
 *   taught — resolves to `{ literals: [], unresolved: true }`, and that flag
 *   is what makes "we could not tell" visible instead of silently reading as
 *   "this primitive sets nothing" (the defect a prior version of this file
 *   shipped: `classes(() => hlmH1)`, a bare reference to a same-file plain
 *   string const, produced an empty result with no way to tell it apart from
 *   a directive that legitimately sets no appearance at all).
 */
function resolveClassExpr(raw, ctx) {
  const text = stripComments(raw).trim();
  if (text === '') return { literals: [], unresolved: false };

  if (isWholeStringLiteral(text)) {
    return { literals: [text.slice(1, -1)], unresolved: false };
  }

  if (text.startsWith('[') && text.endsWith(']')) {
    const literals = [];
    let unresolved = false;
    for (const part of splitTopLevel(text.slice(1, -1), ',')) {
      if (part.trim() === '') continue;
      const r = resolveClassExpr(part, ctx);
      literals.push(...r.literals);
      unresolved = unresolved || r.unresolved;
    }
    return { literals, unresolved };
  }

  // A block-bodied arrow function (`() => { if (...) {...} else {...} }`, as
  // hlm-sidebar's does) is swept for every string literal it could ever
  // return rather than traced branch by branch — the same deliberate
  // over-approximation already used for cva() variants: this only needs to
  // know a family is EVER possible, not which control-flow path runs.
  if (text.startsWith('{') && text.endsWith('}')) {
    return { literals: literalsIn(text), unresolved: false };
  }

  const ternary = topLevelTernary(text);
  if (ternary !== null) {
    const a = resolveClassExpr(ternary.then, ctx);
    const b = resolveClassExpr(ternary.else, ctx);
    return { literals: [...a.literals, ...b.literals], unresolved: a.unresolved || b.unresolved };
  }

  // `cond && value` (hlm-pagination-link, hlm-sidebar-menu-action): the
  // condition can never be statically known, but the value it gates can be.
  const and = topLevelAnd(text);
  if (and !== null) {
    return resolveClassExpr(and, ctx);
  }

  // A runtime accessor — `this._additionalClasses()`, `this.variant()` used
  // bare rather than as a cva() argument, or a plain property read like
  // `this._dynamicComponentClass` with no call at all — can never be
  // statically known. That is a real, KNOWN answer ("contributes nothing
  // statically"), not a parse failure, so it must not be flagged unresolved.
  if (/^this\.[A-Za-z_$][\w$]*(\([\s\S]*\))?$/.test(text)) {
    return { literals: [], unresolved: false };
  }

  // A single call spanning the whole expression: NAME(...). Resolve NAME
  // against a cva() variants function declared locally, else globally
  // (composing another module's variants function, e.g. hlmComboboxChipRemove
  // reusing buttonVariants).
  const callMatch = /^([A-Za-z_$][\w$]*)\([\s\S]*\)$/.exec(text);
  if (callMatch !== null) {
    const name = callMatch[1];
    const resolved = ctx.localCva.get(name) ?? ctx.globalCva.get(name);
    if (resolved !== undefined) return { literals: resolved, unresolved: false };
    return { literals: [], unresolved: true };
  }

  // A bare identifier spanning the whole expression: `classes(() => hlmH1)`
  // referencing a plain `export const hlmH1 = '...'` string, resolved the
  // same way — local file first, then any other file that exports it.
  if (/^[A-Za-z_$][\w$]*$/.test(text)) {
    const resolved = ctx.localConst.get(text) ?? ctx.globalConst.get(text);
    if (resolved !== undefined) return { literals: [resolved], unresolved: false };
    return { literals: [], unresolved: true };
  }

  return { literals: [], unresolved: true };
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
 * no-appearance-on-primitive.ts).
 *
 * A directive's own class list can be declared three ways in this codebase,
 * and every one of them is resolved before a family set is trusted as known:
 *
 * 1. Inline — a string or array literal, ternaries and all, right in the
 *    `classes(() => ...)` call (hlm-resizable-group, hlm-carousel-content, ...).
 * 2. A `cva('base', { variants: {...} })` result (hlmBtn, hlmBadge, ...). The
 *    base string and every variant's string are pooled together, because any
 *    variant may render depending on an input the call site never controls —
 *    this only needs to know whether a family is EVER possible, not which
 *    variant is active.
 * 3. A bare reference to a same-file `export const NAME = '...'` plain string
 *    (hlm-separator, hlmH1, and the rest of the typography directives).
 *
 * A `classes()` call that resolves to none of the three above is UNRESOLVED,
 * not empty — see `resolveClassExpr`. `unresolvedAppearanceSelectors()` below
 * is what makes that state visible; `appearanceFamiliesOf` deliberately does
 * NOT fall back to treating unresolved as empty, because that fallback is
 * exactly the defect this file shipped once already.
 */
let derivedCache = null;

function deriveAppearanceFamilies() {
  if (derivedCache !== null) return derivedCache;

  const files = walkTsFiles(LIBS_UI);
  const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

  // Pass 1: every `const NAME = cva(...)` and every `const NAME = '...'`
  // plain-string constant, both locally (per file) and globally, so a
  // directive that imports another module's constant (e.g. hlmComboboxChipRemove
  // composing buttonVariants) still resolves.
  const globalCva = new Map();
  const localCva = new Map();
  const globalConst = new Map();
  const localConst = new Map();

  for (const [file, src] of sources) {
    const perFileCva = new Map();
    for (const match of src.matchAll(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*cva\(/g)) {
      const name = match[1];
      const openIdx = match.index + match[0].length - 1;
      const literals = literalsIn(extractBalancedParen(src, openIdx));
      perFileCva.set(name, literals);
      if (!globalCva.has(name)) globalCva.set(name, literals);
    }
    localCva.set(file, perFileCva);

    const perFileConst = new Map();
    for (const match of src.matchAll(
      /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,
    )) {
      const [, name, literal] = match;
      const value = literal.slice(1, -1);
      perFileConst.set(name, value);
      if (!globalConst.has(name)) globalConst.set(name, value);
    }
    localConst.set(file, perFileConst);
  }

  // Pass 2: every selector, and every `classes(...)` call attributed to the
  // nearest PRECEDING selector in the same file — true for every directive in
  // libs/ui today, one class body (decorator, then constructor) at a time.
  // Resolved per call via resolveClassExpr; `unresolved` names the selector
  // AND the file, so a coverage test can point straight at the offending line.
  const pool = new Map(); // raw selector string -> Set<string> of pooled class-list literals
  const unresolved = new Map(); // raw selector string -> file

  for (const [file, src] of sources) {
    const selectorHits = [...src.matchAll(/selector:\s*'([^']*)'/g)]
      .map((m) => ({ pos: m.index, value: m[1] }));
    if (selectorHits.length === 0) continue;

    const ctx = {
      localCva: localCva.get(file),
      globalCva,
      localConst: localConst.get(file),
      globalConst,
    };

    for (const call of src.matchAll(/\bclasses\(\s*\(\)\s*=>\s*/g)) {
      const arrowEnd = call.index + call[0].length;
      const openIdx = src.indexOf('(', call.index);
      const callText = extractBalancedParen(src, openIdx);
      // callText spans from `classes(` through its matching `)`; the arrow
      // function's own body is everything after `() =>` up to that same
      // closing paren, one character short of callText's own trailing `)`.
      // A multi-line call commonly ends `'...',\n\t\t);` — a trailing comma
      // after the arrow function's own expression, once an options argument
      // this codebase has never needed. Stripped before resolving so it is
      // not mistaken for "not a whole string literal after all".
      const exprText = src.slice(arrowEnd, openIdx + callText.length - 1).trim().replace(/,\s*$/, '');

      let current = null;
      for (const hit of selectorHits) {
        if (hit.pos <= call.index) current = hit;
        else break;
      }
      if (current === null) continue;

      const result = resolveClassExpr(exprText, ctx);
      if (result.unresolved) {
        unresolved.set(current.value, file);
        continue;
      }

      const bucket = pool.get(current.value) ?? new Set();
      for (const literal of result.literals) bucket.add(literal);
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

  derivedCache = { families, unresolved };
  return derivedCache;
}

/**
 * The appearance families the named primitive's own styling actually sets.
 * Returns an empty Set both for a primitive with no `classes()` call at all
 * (legitimately renders no appearance) and for a name the vocabulary has never
 * seen — NOT for a primitive whose `classes()` call is unresolved; callers
 * that need to tell "known empty" apart from "could not tell" must consult
 * `unresolvedAppearanceSelectors()` too.
 */
export function appearanceFamiliesOf(name) {
  return deriveAppearanceFamilies().families.get(name) ?? new Set();
}

/**
 * Every selector string whose `classes()` call could not be resolved to a
 * known set of literals, mapped to the file it was found in. Empty is the
 * only acceptable steady state: a non-empty result means either a real gap in
 * `resolveClassExpr` (spartan added a fourth way to declare classes) or a
 * genuine typo, and either way `appearanceFamiliesOf` for that name is
 * silently wrong until it is fixed — see the coverage test in
 * vocabulary.test.ts that asserts this stays empty.
 */
export function unresolvedAppearanceSelectors() {
  return deriveAppearanceFamilies().unresolved;
}
