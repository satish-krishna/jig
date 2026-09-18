// Slice spec types, validation, and name derivation for the vertical-slice generator.
// The spec is the single source of truth for a feature: name, fields, and icon.
// Every emitter depends on deriveNames() to produce consistent identifiers across
// the stack (Pascal/camel/kebab/snake casings, operation prefixes, route paths).

import { readFileSync } from 'node:fs';
import { words } from '../init/rename.ts';

export interface FieldSpec {
  name: string;                          // camelCase
  type: 'string' | 'number' | 'boolean';
  label: string;
  unique?: boolean;
  format?: 'email';
  placeholder?: string;
}

export interface SliceSpec {
  name: string;                          // singular PascalCase
  plural?: string;                       // override when the rule is wrong
  icon: string;                          // a lucide export, e.g. lucideUsers
  fields: readonly FieldSpec[];
}

export interface SliceNames {
  pascal: string;       // Order
  pascalPlural: string; // Orders
  camel: string;        // order
  camelPlural: string;  // orders
  kebab: string;        // order
  kebabPlural: string;  // orders
  snakePlural: string;  // orders          — module and command prefix
  opPrefix: string;     // orders          — operation keys: orders.list
  route: string;        // /orders
}

export interface EmittedFile {
  path: string;
  text: string;
}

/**
 * Pluralize a word using four rules, in order. Rules must not overlap: the -y
 * rule fires only on consonant+y, not vowel+y, so "Day" stays "Days" not "Daies".
 */
function pluralize(singular: string): string {
  if (/[^aeiou]y$/.test(singular)) return singular.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/.test(singular)) return singular + 'es';
  if (/[^aeiou]o$/.test(singular)) return singular + 'es';
  return singular + 's';
}

/**
 * Validate a raw spec object and return a typed SliceSpec. Throws on validation failure
 * with a message that names the constraint violated. Constraints: name must be PascalCase,
 * fields must be non-empty, fields may have at most one unique field, each field must
 * have name (camelCase), type (one of the allowed strings), and label (string).
 */
export function validateSpec(raw: unknown): SliceSpec {
  // Type guard: must be an object
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Spec must be an object');
  }

  const obj = raw as Record<string, unknown>;

  // Validate name: must be a string and start with uppercase (PascalCase)
  const name = obj.name;
  if (typeof name !== 'string') {
    throw new Error('name must be a string');
  }
  if (!/^[A-Z]/.test(name)) {
    throw new Error('name must be PascalCase');
  }

  // Validate plural override: must be a string if present
  if ('plural' in obj && obj.plural !== undefined && typeof obj.plural !== 'string') {
    throw new Error('plural must be a string');
  }

  // Validate icon: must be a string
  const icon = obj.icon;
  if (typeof icon !== 'string') {
    throw new Error('icon must be a string');
  }

  // Validate fields: must be an array, non-empty, at most one unique
  const fields = obj.fields;
  if (!Array.isArray(fields)) {
    throw new Error('fields must be an array');
  }
  if (fields.length === 0) {
    throw new Error('fields must have at least one field');
  }

  // Count unique fields
  const uniqueCount = fields.filter((f: unknown) => {
    if (typeof f !== 'object' || f === null) return false;
    return (f as Record<string, unknown>).unique === true;
  }).length;
  if (uniqueCount > 1) {
    throw new Error('fields can have at most one unique field');
  }

  // Validate each field structure
  for (const field of fields) {
    if (typeof field !== 'object' || field === null) {
      throw new Error('Each field must be an object');
    }
    const f = field as Record<string, unknown>;
    if (typeof f.name !== 'string') throw new Error('Field name must be a string');
    if (typeof f.type !== 'string' || !['string', 'number', 'boolean'].includes(f.type)) {
      throw new Error('Field type must be string, number, or boolean');
    }
    if (typeof f.label !== 'string') throw new Error('Field label must be a string');

    // Validate optional field members
    if ('unique' in f && f.unique !== undefined && typeof f.unique !== 'boolean') {
      throw new Error('Field unique must be a boolean');
    }
    // A unique boolean caps the table at two rows for all time; it is never what an author
    // means, so it is rejected here rather than taught to every downstream emitter.
    if (f.unique === true && f.type === 'boolean') {
      throw new Error('A boolean field cannot be unique');
    }
    if ('format' in f && f.format !== undefined && f.format !== 'email') {
      throw new Error('Field format must be email');
    }
    // 'email' formats a string's presentation and validation. A number or boolean field
    // has no textual representation for .email() to check, so a downstream emitter
    // handed one would have to either silently ignore it or emit a bogus zod call
    // (z.number().email(...)); rejecting the combination here means no emitter has to
    // decide which of those two wrong things to do.
    if (f.format !== undefined && f.type !== 'string') {
      throw new Error('Field format is only valid on a string field');
    }
    if ('placeholder' in f && f.placeholder !== undefined && typeof f.placeholder !== 'string') {
      throw new Error('Field placeholder must be a string');
    }
  }

  return {
    name,
    plural: typeof obj.plural === 'string' ? obj.plural : undefined,
    icon,
    fields: fields as readonly FieldSpec[],
  };
}

/**
 * Derive all name forms from a validated spec. Produces Pascal, camel, kebab, and snake
 * casings for both singular and plural forms. Plural is either explicit (spec.plural)
 * or derived via the pluralize rules. Word splitting uses the same splitter as template init,
 * so multiword names like PurchaseOrder correctly decompose.
 */
export function deriveNames(spec: SliceSpec): SliceNames {
  // Determine plural form: explicit override or pluralize rule
  const plural = spec.plural || pluralize(spec.name);

  // Split names into word arrays for case transformations
  const singularWords = words(spec.name);
  const pluralWords = words(plural);

  // Pascal: the names as given
  const pascal = spec.name;
  const pascalPlural = plural;

  // Camel: first word lowercase, rest title-case
  const camel = singularWords.length > 0
    ? singularWords[0].toLowerCase() + singularWords.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('')
    : '';
  const camelPlural = pluralWords.length > 0
    ? pluralWords[0].toLowerCase() + pluralWords.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('')
    : '';

  // Kebab: lowercase words joined by hyphens
  const kebab = singularWords.map(w => w.toLowerCase()).join('-');
  const kebabPlural = pluralWords.map(w => w.toLowerCase()).join('-');

  // Snake: lowercase words joined by underscores (plural only)
  const snakePlural = pluralWords.map(w => w.toLowerCase()).join('_');

  // Operation prefix and route: both use the plural form, camelCase and kebab respectively
  const opPrefix = camelPlural;
  const route = '/' + kebabPlural;

  return {
    pascal,
    pascalPlural,
    camel,
    camelPlural,
    kebab,
    kebabPlural,
    snakePlural,
    opPrefix,
    route,
  };
}

/**
 * Load and validate a slice spec from a JSON file. Returns a typed SliceSpec or throws
 * on validation failure.
 */
export function loadSpec(path: string): SliceSpec {
  const text = readFileSync(path, 'utf-8');
  const raw = JSON.parse(text);
  return validateSpec(raw);
}
