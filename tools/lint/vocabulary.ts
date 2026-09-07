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
