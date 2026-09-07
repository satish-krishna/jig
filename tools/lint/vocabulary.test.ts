import { test } from 'node:test';
import assert from 'node:assert/strict';
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
