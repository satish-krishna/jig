import { provideFormControlDefaults, type FormControlDefinition } from '../control-definition';
import { CheckboxControl } from './checkbox.control';
import { TextControl } from './text.control';
import { TextareaControl } from './textarea.control';

const isType = (type: string) => (s: { def: { type: string } }) => s.def.type === type;

/**
 * The shipped controls, ordered SPECIFIC BEFORE GENERAL. Order is semantic:
 * resolution is first-match-wins, so a definition that claims a narrower shape
 * must come before one that claims a broader shape.
 *
 * @capability forms.default-controls
 * @intent The default catalog is one ordered list, reviewable in one place.
 * @reuse Call provideDefaultFormControls() in app config. Add a kind with a new file plus one entry.
 */
export const DEFAULT_FORM_CONTROLS: readonly FormControlDefinition[] = [
  { kind: 'textarea', component: TextareaControl, defaultValue: () => '' },
  { kind: 'checkbox', component: CheckboxControl, defaultValue: () => false, matches: isType('boolean') },
  { kind: 'number', component: TextControl, defaultValue: () => null, matches: isType('number') },
  { kind: 'email', component: TextControl, defaultValue: () => '' },
  { kind: 'text', component: TextControl, defaultValue: () => '', matches: isType('string') },
];

export function provideDefaultFormControls() {
  // Defaults go on their own token, so anything a caller registers with
  // provideFormControls() resolves first without disturbing this list's order.
  return provideFormControlDefaults(...DEFAULT_FORM_CONTROLS);
}

export { TextControl, TextareaControl, CheckboxControl };
