// Small C#-naming helpers shared by every .NET emitter for the vertical-slice generator
// (production and test). Kept separate from emit-dotnet.ts so a second consumer does not have
// to import that file's internals, and small enough that a third consumer costs nothing to add.

import type { FieldSpec, SliceSpec } from './spec.ts';

/** C# type for each spec field type, matching the `required` properties on User.cs. */
export const CS_TYPE: Record<FieldSpec['type'], string> = { string: 'string', number: 'decimal', boolean: 'bool' };

/** camelCase field name -> PascalCase C# property name, e.g. "reference" -> "Reference". */
export function pascalField(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The spec's one unique field, if it has one. validateSpec already guarantees at most one. */
export function uniqueField(spec: SliceSpec): FieldSpec | undefined {
  return spec.fields.find((f) => f.unique === true);
}
