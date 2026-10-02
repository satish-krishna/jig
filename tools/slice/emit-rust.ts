// The desktop shell's per-slice store emitter. Builds a self-contained module mirroring the
// shape of the exemplar's own hand-written store — a struct, an expected-failure enum, an
// in-memory Mutex<HashMap> store with list/get/save, and unit tests — with the spec's own
// fields substituted in. This whole file is thick-only: a thin clone has no desktop shell to
// generate a store for, so its entire body sits behind one thick-cut marker, mirroring how
// tools/slice/slice.ts wraps its import of emitRustStore. No disk access here — the CLI
// decides where this EmittedFile lands.
// thick:start
import type { EmittedFile, FieldSpec, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { interpolatedString } from './literal.ts';
import { uniqueField } from './csharp.ts';
import { label, snake } from './naming.ts';
import { renderTemplate } from './render.ts';

/** Native type for each spec field type, matching the shape of the exemplar's own store. */
export const RUST_TYPE: Record<FieldSpec['type'], string> = { string: 'String', number: 'f64', boolean: 'bool' };

/** A literal for a field's sample value, comparable to the field in an assert_eq!. */
function rustValue(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return variant === 0 ? '1.0' : '2.0';
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? '"alpha@x.io"' : '"bravo@x.io"';
  return variant === 0 ? '"alpha"' : '"bravo"';
}

/** A source-ready argument for a field's sample value, `variant` distinguishing two records. */
function rustSample(f: FieldSpec, variant: 0 | 1): string {
  return f.type === 'string' ? `${rustValue(f, variant)}.to_string()` : rustValue(f, variant);
}

interface RustStoreModel {
  pascal: string;
  snakePlural: string;
  kebab: string;
  noun: string;
  entity: string;
  first: string;
  fields: Array<{ snake: string; rustType: string }>;
  unique: { snake: string; labelInterpolated: string } | null;
  changed: { snake: string; value1: string } | null;
  params: string;
  construct: string;
  sample0: string;
  sample1: string;
  sampleKeepingUnique1: string;
  firstValue0: string;
}

function rustStoreModel(spec: SliceSpec): RustStoreModel {
  const n = deriveNames(spec);
  const unique = uniqueField(spec);
  const entity = snake(n.pascal);
  const noun = label(n.kebab);
  const first = snake(spec.fields[0].name);

  const fields = spec.fields.map((f) => ({
    snake: snake(f.name),
    rustType: RUST_TYPE[f.type],
  }));

  const params = spec.fields.map((f) => `${snake(f.name)}: ${RUST_TYPE[f.type]}`).join(', ');
  const construct = spec.fields.map((f) => snake(f.name)).join(', ');
  const sampleArgs = (variant: 0 | 1) => spec.fields.map((f) => rustSample(f, variant)).join(', ');
  const sampleArgsKeepingUnique = (otherVariant: 0 | 1) =>
    spec.fields.map((f) => rustSample(f, f === unique ? 0 : otherVariant)).join(', ');

  const changed = spec.fields.find((f) => f !== unique);
  const uniqueModel = unique
    ? {
        snake: snake(unique.name),
        labelInterpolated: interpolatedString(unique.label),
      }
    : null;

  const changedModel = changed
    ? {
        snake: snake(changed.name),
        value1: rustValue(changed, 1),
      }
    : null;

  return {
    pascal: n.pascal,
    snakePlural: n.snakePlural,
    kebab: n.kebab,
    noun,
    entity,
    first,
    fields,
    unique: uniqueModel,
    changed: changedModel,
    params,
    construct,
    sample0: sampleArgs(0),
    sample1: sampleArgs(1),
    sampleKeepingUnique1: sampleArgsKeepingUnique(1),
    firstValue0: rustValue(spec.fields[0], 0),
  };
}

/**
 * Emit the desktop shell's per-slice store.
 *
 * @capability tools.slice.emit-rust
 * @intent Give a generated slice the same store shape the exemplar's own hand-written
 * store has, so the desktop shell behaves identically for a generated slice as for one an
 * agent wrote by hand.
 * @reuse Call once per slice from the generator CLI; the result is a single EmittedFile.
 */
export function emitRustStore(spec: SliceSpec): EmittedFile {
  const n = deriveNames(spec);
  const text = renderTemplate('rust/store.rs.ejs', rustStoreModel(spec));
  return { path: `apps/desktop/src-tauri/src/${n.snakePlural}.rs`, text };
}
// thick:end
