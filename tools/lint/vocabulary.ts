import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GENERATED = join(
  ROOT, 'frontend', 'src', 'app', 'showcase', 'component-api.generated.ts',
);

/**
 * The installed primitive vocabulary, read from the file tools/showcase-api
 * already generates from libs/ui and npm run verify already checks for freshness.
 * No second generator: a hand-written table of primitive names would rot the
 * first time spartan is upgraded or the style is switched.
 */
let cache = null;

function selectors() {
  if (cache !== null) return cache;

  const src = readFileSync(GENERATED, 'utf8');
  const attributes = new Set();
  const elements = new Set();

  for (const match of src.matchAll(/"selector":\s*"([^"]+)"/g)) {
    // A selector is a comma-separated list, and a single primitive may declare
    // BOTH forms: "[hlmAccordion], hlm-accordion". Split first, classify each.
    for (const raw of match[1].split(',')) {
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
 * Headings map to the typography family rather than to a same-numbered primitive.
 * <h1 hlmH3> is correct and is what the showcase already does: the element
 * carries semantics, the directive carries appearance, and hlmH1's text-4xl
 * belongs to a marketing page rather than a compact desktop shell.
 */
const HEADINGS = ['hlmH1', 'hlmH2', 'hlmH3', 'hlmH4', 'hlmLarge'];

export const NATIVE_TO_PRIMITIVE = {
  button: ['hlmBtn', 'hlmSidebarMenuButton', 'hlmToggle', 'hlmPaginationLink'],
  input: ['hlmInput'],
  textarea: ['hlmTextarea'],
  table: ['hlmTable'],
  h1: HEADINGS,
  h2: HEADINGS,
  h3: HEADINGS,
  h4: HEADINGS,
  p: ['hlmP', 'hlmMuted', 'hlmLead', 'hlmSmall', 'hlmAlertDescription'],
  ul: ['hlmUl'],
  blockquote: ['hlmBlockquote'],
  code: ['hlmCode'],
  label: ['hlmLabel', 'hlmFieldLabel'],
};
