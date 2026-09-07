import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attributeSelectors, elementSelectors, appearanceFamiliesOf,
  unresolvedAppearanceSelectors, NATIVE_TO_PRIMITIVE,
} from './vocabulary.ts';

test('derives attribute directives from the generated selectors', () => {
  const attrs = attributeSelectors();

  assert.ok(attrs.has('hlmBtn'), 'hlmBtn missing');
  assert.ok(attrs.has('hlmH3'), 'hlmH3 missing');
  assert.ok(attrs.has('hlmAccordion'), 'combined selectors must yield their attribute half');
});

test('derives element selectors from the same source', () => {
  const els = elementSelectors();

  assert.ok(els.has('hlm-accordion'), 'combined selectors must yield their element half');
  assert.ok(els.has('hlm-alert-dialog'), 'hlm-alert-dialog missing');
});

test('does not assume attribute and element forms are disjoint', () => {
  // 138 of 318 nova selectors declare both forms, e.g. "[hlmAccordion], hlm-accordion".
  // A rule that assumes one-or-the-other reports every combined primitive as wrong.
  assert.ok(attributeSelectors().has('hlmAccordion'));
  assert.ok(elementSelectors().has('hlm-accordion'));
});

test('reads an element-qualified selector as an attribute', () => {
  // "button[hlmAlertDialogAction]" is an attribute directive restricted to <button>.
  assert.ok(attributeSelectors().has('hlmAlertDialogAction'));
  assert.ok(!elementSelectors().has('button'));
});

test('every primitive the native map suggests actually exists', () => {
  // The map is the one hand-written part. A spartan upgrade or `npm run ui:style`
  // that drops a primitive must fail loudly here rather than leave a rule
  // suggesting a fix that no longer compiles. This is DR0002's lesson: a check
  // that stays green because its data vanished is paperwork.
  const attrs = attributeSelectors();
  const els = elementSelectors();

  for (const [native, primitives] of Object.entries(NATIVE_TO_PRIMITIVE)) {
    for (const p of primitives) {
      assert.ok(attrs.has(p) || els.has(p), `<${native}> suggests "${p}", which no longer exists`);
    }
  }
});

test('the native map is narrowed to controls, not typography', () => {
  // A bare <button> is always wrong; a bare <p> is always fine. The two do not
  // share a predicate, so typography stays out of this map. See the comment on
  // NATIVE_TO_PRIMITIVE in vocabulary.ts for the full reasoning and the
  // measurement (97 bare occurrences, 49 of them bare <p>, mostly plain prose)
  // that backs it. Pinned here so a future edit that widens the map back to
  // headings, <p>, <ul>, <blockquote>, <code> or <label> fails loudly instead
  // of drifting in unnoticed.
  assert.deepEqual(Object.keys(NATIVE_TO_PRIMITIVE).sort(), ['button', 'input', 'table', 'textarea']);
});

test('the vocabulary is large enough to be real', () => {
  // Guards against a parse failure silently yielding empty sets, which would make
  // every vocabulary rule pass on everything.
  assert.ok(attributeSelectors().size + elementSelectors().size > 200);
});

test('derives the appearance families a primitive actually sets, from its own classes() call', () => {
  // hlm-resizable-group is `classes(() => 'group flex h-full w-full
  // data-[panel-group-direction=vertical]:flex-col')` — no border, no rounded, no
  // padding, no color. A call-site border/rounded on it is pure addition, not an
  // override, and no-appearance-on-primitive must not treat it as one.
  const resizableGroup = appearanceFamiliesOf('hlm-resizable-group');
  assert.ok(!resizableGroup.has('decoration'), 'hlm-resizable-group should not be derived as setting decoration');
  assert.ok(!resizableGroup.has('padding'), 'hlm-resizable-group should not be derived as setting padding');

  // hlmBtn's own cva base and variants set color (bg-primary, text-destructive, ...),
  // typography (text-sm, font-medium) and decoration (rounded-lg, border) — a
  // call-site override of any of those families is a real fight, not an addition.
  const btn = appearanceFamiliesOf('hlmBtn');
  assert.ok(btn.has('color'), 'hlmBtn should be derived as setting color');
  assert.ok(btn.has('typography'), 'hlmBtn should be derived as setting typography');
  assert.ok(btn.has('decoration'), 'hlmBtn should be derived as setting decoration');
});

test('resolves classes(() => bareIdentifier) against a same-file plain string const', () => {
  // hlm-separator: `export const hlmSeparatorClass = 'inline-flex shrink-0
  // bg-border ...'` then `classes(() => hlmSeparatorClass)`. Resolving a bare
  // identifier reference, not just a cva() call or an inline literal, is the
  // gap that let `bg-red-500` on <hlm-separator> pass silently.
  assert.ok(appearanceFamiliesOf('hlm-separator').has('color'), 'hlm-separator should be derived as setting color');

  // hlmH1: `export const hlmH1 = 'scroll-m-20 text-4xl font-extrabold
  // tracking-tight lg:text-5xl'` then `classes(() => hlmH1)` — the same
  // bare-identifier shape, in the typography family this time.
  assert.ok(appearanceFamiliesOf('hlmH1').has('typography'), 'hlmH1 should be derived as setting typography');
});

test('a classes() call the deriver cannot resolve is UNRESOLVED, never a silent empty set', () => {
  // The defect this guards against: a parse failure and a directive that
  // genuinely renders no appearance both looked like an empty Set<AppearanceFamily>,
  // so nothing could tell "we could not parse this" apart from "this primitive
  // sets nothing". A directive with NO classes() call at all is legitimately
  // empty and must never appear here.
  const unresolved = unresolvedAppearanceSelectors();

  assert.equal(unresolved.size, 0, () => {
    const lines = [...unresolved].map(([selector, file]) => `  ${selector} in ${file}`);
    return `${unresolved.size} classes() call(s) could not be resolved to a known appearance family set:\n${lines.join('\n')}`;
  });
});

test('every directive with a classes() call is covered — walking libs/ui directly, not through a hand-picked sample', () => {
  // Same intent as "the vocabulary is large enough to be real" above, aimed at
  // the deriver specifically: if a future spartan upgrade introduces a fourth
  // way of declaring a directive's classes, this walks the real source tree
  // and must still find nothing unresolved, rather than trusting that today's
  // three known shapes (inline literal/array, cva(), bare same-file const)
  // stay the only three forever.
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const LIBS_UI = join(ROOT, 'frontend', 'libs', 'ui');

  const walk = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(path));
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) out.push(path);
    }
    return out;
  };

  let sawAClassesCall = false;
  for (const file of walk(LIBS_UI)) {
    if (/\bclasses\(/.test(readFileSync(file, 'utf8'))) sawAClassesCall = true;
  }
  assert.ok(sawAClassesCall, 'expected at least one classes() call under frontend/libs/ui — the walk found none, so this test would pass on a broken deriver too');
  assert.equal(unresolvedAppearanceSelectors().size, 0);
});

test('each primitive in the native map is compatible with its target element', () => {
  // The map's model is "add this attribute directive to this native HTML element".
  // Primitives may be qualified to specific tags or unqualified.
  // - Qualified: "button[hlmBtn], a[hlmBtn]" permits button and a.
  // - Unqualified: "[hlmAccordion]" permits any tag.
  // - Element-only: "hlm-native-select" is not an attribute, cannot be in this map.
  // Assert that each primitive is actually compatible with the native element it
  // is mapped to.
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const GENERATED = join(
    ROOT, 'frontend', 'src', 'app', 'showcase', 'component-api.generated.ts',
  );
  const src = readFileSync(GENERATED, 'utf8');

  // Build a map of primitive name to its declared selector(s).
  const primitiveToSelectors = new Map();
  for (const match of src.matchAll(/"selector":\s*"([^"]+)"/g)) {
    const selectorString = match[1];
    for (const part of selectorString.split(',')) {
      const trimmed = part.trim();
      // Extract the attribute name if present.
      const attrMatch = /\[([A-Za-z][\w-]*)\]/.exec(trimmed);
      if (attrMatch !== null) {
        const attrName = attrMatch[1];
        if (!primitiveToSelectors.has(attrName)) {
          primitiveToSelectors.set(attrName, []);
        }
        primitiveToSelectors.get(attrName).push(trimmed);
      }
    }
  }

  for (const [native, primitives] of Object.entries(NATIVE_TO_PRIMITIVE)) {
    for (const prim of primitives) {
      const selectorParts = primitiveToSelectors.get(prim);
      assert.ok(
        selectorParts && selectorParts.length > 0,
        `<${native}> suggests "${prim}", which is not a registered attribute primitive`,
      );

      // Extract the set of tags this primitive is qualified to.
      const allowedTags = new Set();
      let isUnqualified = false;

      for (const part of selectorParts) {
        // Match element-qualified attribute: "tag[attr]"
        const qualMatch = /^([A-Za-z][\w-]*)\[/.exec(part);
        if (qualMatch) {
          allowedTags.add(qualMatch[1]);
        } else if (/^\[/.test(part)) {
          // Unqualified attribute: "[attr]"
          isUnqualified = true;
        } else {
          // Element-only form, no bracket. This primitive has no attribute form.
          assert.fail(
            `<${native}> suggests "${prim}", which is declared only as an element (${part}), not as an attribute`,
          );
        }
      }

      // If qualified, the native element must be in the allowed set.
      if (allowedTags.size > 0 && !isUnqualified) {
        assert.ok(
          allowedTags.has(native),
          `<${native}> suggests "${prim}", but "${prim}" is qualified to [${Array.from(allowedTags).join(', ')}], not to <${native}>`,
        );
      }
    }
  }
});
