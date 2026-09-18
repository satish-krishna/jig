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
import { uniqueField } from './csharp.ts';

/** Native type for each spec field type, matching the shape of the exemplar's own store. */
export const RUST_TYPE: Record<FieldSpec['type'], string> = { string: 'String', number: 'f64', boolean: 'bool' };

/** A source-ready literal for a field's sample value, `variant` distinguishing two records. */
function rustSample(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return variant === 0 ? '1.0' : '2.0';
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? '"a@x.io".to_string()' : '"b@x.io".to_string()';
  return variant === 0 ? '"a".to_string()' : '"b".to_string()';
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
  const unique = uniqueField(spec);
  const first = spec.fields[0];

  const structFields = spec.fields.map((f) => `    pub ${f.name}: ${RUST_TYPE[f.type]},`).join('\n');
  const params = spec.fields.map((f) => `${f.name}: ${RUST_TYPE[f.type]}`).join(', ');
  const assign = spec.fields.map((f) => `                ${n.camel}.${f.name} = ${f.name};`).join('\n');
  const construct = spec.fields.map((f) => f.name).join(', ');
  const sampleArgs = (variant: 0 | 1) => spec.fields.map((f) => rustSample(f, variant)).join(', ');
  // Keeps the unique field's value at variant 0 while every other field varies, so a
  // conflict test proves the store rejects on the unique field specifically rather than
  // on an accidental exact duplicate.
  const sampleArgsKeepingUnique = (otherVariant: 0 | 1) =>
    spec.fields.map((f) => rustSample(f, f === unique ? 0 : otherVariant)).join(', ');

  const conflictCheck = unique
    ? `        if let Some(existing) = ${n.snakePlural}.values().find(|x| x.${unique.name} == ${unique.name}) {
            if Some(&existing.id) != id.as_ref() {
                return Err(StoreError::Conflict(format!("${unique.label} {${unique.name}} is already in use.")));
            }
        }

`
    : '';

  const conflictTests = unique
    ? `
    #[test]
    fn save_duplicate_${unique.name}_on_a_different_${n.camel}_is_conflict() {
        let store = ${n.pascal}Store::default();
        store.save(None, ${sampleArgs(0)}).unwrap();
        let result = store.save(None, ${sampleArgsKeepingUnique(1)});
        assert!(matches!(result, Err(StoreError::Conflict(_))));
    }

    #[test]
    fn save_update_keeps_the_same_${unique.name}_without_conflict() {
        let store = ${n.pascal}Store::default();
        let created = store.save(None, ${sampleArgs(0)}).unwrap();
        let updated = store
            .save(Some(created.id.clone()), ${sampleArgsKeepingUnique(1)})
            .unwrap();
        assert_eq!(updated.id, created.id);
    }
`
    : '';

  const text = `//! ${n.pascal} store for the desktop client. Holds the same ${n.camel} use-cases the
//! .NET API does, so the frontend behaves identically whether it talks to the native
//! store or to the API over HTTP. Command adapters are thin wrappers over this; the
//! logic is here and unit-tested in isolation.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

/// The ${n.camel} shape crossing the wire. Serializes to the same JSON as the .NET
/// ${n.pascal}Response, so the operation registry's res type fits both.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ${n.pascal} {
    pub id: String,
${structFields}
}

/// An expected failure. Maps to a rejected invoke on the wire.
#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(String),
    Conflict(String),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StoreError::NotFound(m) | StoreError::Conflict(m) => write!(f, "{m}"),
        }
    }
}

/// In-memory ${n.camel} store. A template default: swap the Mutex<HashMap> for SQLite or
/// a file store without changing the commands or the frontend.
#[derive(Default)]
pub struct ${n.pascal}Store {
    ${n.snakePlural}: Mutex<HashMap<String, ${n.pascal}>>,
}

impl ${n.pascal}Store {
    pub fn list(&self) -> Vec<${n.pascal}> {
        let mut all: Vec<${n.pascal}> = self.${n.snakePlural}.lock().unwrap().values().cloned().collect();
        all.sort_by(|a, b| a.${first.name}.partial_cmp(&b.${first.name}).unwrap_or(std::cmp::Ordering::Equal));
        all
    }

    pub fn get(&self, id: &str) -> Result<${n.pascal}, StoreError> {
        self.${n.snakePlural}
            .lock()
            .unwrap()
            .get(id)
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("${n.pascal} {id} was not found.")))
    }

    pub fn save(&self, id: Option<String>, ${params}) -> Result<${n.pascal}, StoreError> {
        let mut ${n.snakePlural} = self.${n.snakePlural}.lock().unwrap();

${conflictCheck}        match id {
            Some(id) => {
                let ${n.camel} = ${n.snakePlural}
                    .get_mut(&id)
                    .ok_or_else(|| StoreError::NotFound(format!("${n.pascal} {id} was not found.")))?;
${assign}
                Ok(${n.camel}.clone())
            }
            None => {
                let ${n.camel} = ${n.pascal} { id: Uuid::new_v4().to_string(), ${construct} };
                ${n.snakePlural}.insert(${n.camel}.id.clone(), ${n.camel}.clone());
                Ok(${n.camel})
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_is_empty_on_a_fresh_store() {
        let store = ${n.pascal}Store::default();
        assert_eq!(store.list(), vec![]);
    }

    #[test]
    fn save_creates_a_${n.camel}_with_an_id() {
        let store = ${n.pascal}Store::default();
        let ${n.camel} = store.save(None, ${sampleArgs(0)}).unwrap();
        assert!(!${n.camel}.id.is_empty());
        assert_eq!(store.list().len(), 1);
    }

    #[test]
    fn get_unknown_id_is_not_found() {
        let store = ${n.pascal}Store::default();
        assert_eq!(
            store.get("missing"),
            Err(StoreError::NotFound("${n.pascal} missing was not found.".into()))
        );
    }

    #[test]
    fn save_then_get_roundtrips() {
        let store = ${n.pascal}Store::default();
        let created = store.save(None, ${sampleArgs(0)}).unwrap();
        assert_eq!(store.get(&created.id).unwrap(), created);
    }
${conflictTests}
    #[test]
    fn save_update_of_unknown_id_is_not_found() {
        let store = ${n.pascal}Store::default();
        let result = store.save(Some("ghost".to_string()), ${sampleArgs(1)});
        assert!(matches!(result, Err(StoreError::NotFound(_))));
    }
}
`;

  return { path: `apps/desktop/src-tauri/src/${n.snakePlural}.rs`, text };
}
// thick:end
