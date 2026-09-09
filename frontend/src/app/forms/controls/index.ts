import { provideFormControlDefaults, type FormControlDefinition } from '../control-definition';
import { ArrayControl } from './array.control';
import { CheckboxControl } from './checkbox.control';
import { DateControl } from './date.control';
import { GroupControl } from './group.control';
import { MultiselectControl } from './multiselect.control';
import { RadioControl } from './radio.control';
import { SelectControl } from './select.control';
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
  // Override-only kinds first: no matches(), so they never shadow anything.
  { kind: 'textarea', component: TextareaControl, defaultValue: () => '' },
  { kind: 'radio', component: RadioControl, defaultValue: () => '' },
  { kind: 'email', component: TextControl, defaultValue: () => '' },

  // Narrow shapes before broad ones. multiselect claims array-of-enum, so it
  // MUST precede the generic array repeater or it is unreachable.
  { kind: 'multiselect', component: MultiselectControl, defaultValue: () => [],
    matches: (s) => s.def.type === 'array' &&
      ((s.def as unknown as { element: { def: { type: string } } }).element.def.type === 'enum') },
  { kind: 'group', component: GroupControl, matches: isType('object') },
  { kind: 'array', component: ArrayControl, defaultValue: () => [], matches: isType('array') },
  { kind: 'select', component: SelectControl, defaultValue: () => '', matches: isType('enum') },
  { kind: 'date', component: DateControl, defaultValue: () => null, matches: isType('date') },
  { kind: 'checkbox', component: CheckboxControl, defaultValue: () => false, matches: isType('boolean') },
  { kind: 'number', component: TextControl, defaultValue: () => null, matches: isType('number') },
  { kind: 'text', component: TextControl, defaultValue: () => '', matches: isType('string') },
];

export function provideDefaultFormControls() {
  // Defaults go on their own token, so anything a caller registers with
  // provideFormControls() resolves first without disturbing this list's order.
  return provideFormControlDefaults(...DEFAULT_FORM_CONTROLS);
}

export {
  TextControl,
  TextareaControl,
  CheckboxControl,
  SelectControl,
  RadioControl,
  MultiselectControl,
  DateControl,
  GroupControl,
  ArrayControl,
};
