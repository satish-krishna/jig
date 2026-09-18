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

/** A PascalCase type name: it becomes a C# class, a native struct, and a TS identifier. */
const PASCAL_IDENTIFIER = /^[A-Z][A-Za-z0-9]*$/;
/** A camelCase property name: it becomes a C# property, a native field, and a DOM id. */
const CAMEL_IDENTIFIER = /^[a-z][A-Za-z0-9]*$/;
/** A lucide export name, e.g. lucideShoppingCart. Emitted into a TS string literal. */
const ICON_IDENTIFIER = /^[A-Za-z][A-Za-z0-9]*$/;
/** Every emitter gives the entity its own id, so a field called id collides with it. */
const RESERVED_FIELD_NAMES = new Set(['id']);

/**
 * Reserved words across the three languages the generator emits into, kept as three
 * named sets rather than one union so a reader can see where each word came from.
 * None of this aims at exhaustive coverage of every contextual keyword — only the
 * words that actually break a build when spliced in as a field name. `value` and
 * `data` are deliberately absent from all three: they read as risky but are not
 * reserved anywhere, and staying out is the point (see spec.test.ts).
 */

/**
 * C# reserved keywords (not the contextual ones like `var`, `async`, or `nameof`,
 * which remain legal identifiers). A field becomes a property (emit-dotnet.ts:
 * `public required {Type} {Field} { get; set; }`) and a SaveAsync parameter, so any
 * of these breaks the emitted entity, DTO, mapper, or validator outright.
 */
const CSHARP_RESERVED = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this',
  'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
  'using', 'virtual', 'void', 'volatile', 'while',
]);

/**
 * The native runtime's keywords (the strict, always-reserved set — not `union` or other
 * weak keywords that stay legal identifiers). A field name becomes a struct field
 * identifier in the generated store (`pub {name}: {type}`) and a command parameter
 * name; the native runtime has no fallback for a keyword there short of a raw
 * identifier this generator never emits. `Self` is left out below: a camelCase field
 * can never spell it.
 */
const RUST_RESERVED = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
  'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
  'move', 'mut', 'pub', 'ref', 'return', 'self', 'static', 'struct', 'super', 'trait',
  'true', 'type', 'unsafe', 'use', 'where', 'while',
]);

/**
 * TypeScript/JavaScript reserved words (not the contextual ones like `type`, `of`, or
 * `readonly`, which stay legal identifiers — and `type` is already covered above via
 * the native set). A field name is spliced as an identifier-shaped key into the
 * generated zod schema object and the form model.
 */
const TYPESCRIPT_RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'let',
  'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'yield', 'await',
]);

/** Which of the three languages above reserve `name`, by display name, in a fixed order. */
function reservingLanguages(name: string): string[] {
  const langs: string[] = [];
  if (CSHARP_RESERVED.has(name)) langs.push('C#');
  if (RUST_RESERVED.has(name)) langs.push('native');
  if (TYPESCRIPT_RESERVED.has(name)) langs.push('TypeScript');
  return langs;
}

/**
 * Human-facing copy (label, placeholder) is escaped at each emit site rather than rejected
 * here — an apostrophe in an English label is ordinary. A control character is not: a
 * newline cannot be escaped into a single-quoted TypeScript literal at all, so it is the
 * one shape of copy this boundary refuses.
 */
function assertCopy(value: string, what: string): void {
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      throw new Error(`Field ${what} must not contain a control character`);
    }
  }
}

/**
 * Validate a raw spec object and return a typed SliceSpec. Throws on validation failure
 * with a message that names the constraint violated. Constraints: name and plural must be
 * PascalCase identifiers, icon must be an identifier, fields must be non-empty with at most
 * one unique field, and each field must have a unique camelCase-identifier name that is not
 * `id` or a C#/native/TypeScript reserved word, a type from the allowed set, and a label
 * free of control characters.
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
  if (!PASCAL_IDENTIFIER.test(name)) {
    throw new Error('name must be PascalCase');
  }

  // Validate plural override: must be a string if present
  if ('plural' in obj && obj.plural !== undefined && typeof obj.plural !== 'string') {
    throw new Error('plural must be a string');
  }
  if (typeof obj.plural === 'string' && !PASCAL_IDENTIFIER.test(obj.plural)) {
    throw new Error('plural must be PascalCase');
  }

  // Validate icon: must be a string
  const icon = obj.icon;
  if (typeof icon !== 'string') {
    throw new Error('icon must be a string');
  }
  if (!ICON_IDENTIFIER.test(icon)) {
    throw new Error('icon must be a lucide export name, e.g. lucideShoppingCart');
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
  const seen = new Set<string>();
  for (const field of fields) {
    if (typeof field !== 'object' || field === null) {
      throw new Error('Each field must be an object');
    }
    const f = field as Record<string, unknown>;
    if (typeof f.name !== 'string') throw new Error('Field name must be a string');
    // A name that is not an identifier emits a C# property, a native field and a TS key that
    // no compiler accepts, and the error surfaces in generated code far from this file.
    if (!CAMEL_IDENTIFIER.test(f.name)) {
      throw new Error(`Field name must be a camelCase identifier (got ${JSON.stringify(f.name)})`);
    }
    if (RESERVED_FIELD_NAMES.has(f.name)) {
      throw new Error(`Field name ${JSON.stringify(f.name)} is reserved: every entity already has one`);
    }
    const reservedIn = reservingLanguages(f.name);
    if (reservedIn.length > 0) {
      throw new Error(
        `Field name ${JSON.stringify(f.name)} is reserved: it is a keyword in ${reservedIn.join(', ')}`,
      );
    }
    if (seen.has(f.name)) {
      throw new Error(`Duplicate field name ${JSON.stringify(f.name)}`);
    }
    seen.add(f.name);
    if (typeof f.type !== 'string' || !['string', 'number', 'boolean'].includes(f.type)) {
      throw new Error('Field type must be string, number, or boolean');
    }
    if (typeof f.label !== 'string') throw new Error('Field label must be a string');
    assertCopy(f.label, 'label');

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
    if (typeof f.placeholder === 'string') assertCopy(f.placeholder, 'placeholder');
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
