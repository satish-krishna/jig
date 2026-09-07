import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attributeSelectors, elementSelectors, NATIVE_TO_PRIMITIVE } from './vocabulary.ts';

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

test('the vocabulary is large enough to be real', () => {
  // Guards against a parse failure silently yielding empty sets, which would make
  // every vocabulary rule pass on everything.
  assert.ok(attributeSelectors().size + elementSelectors().size > 200);
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
