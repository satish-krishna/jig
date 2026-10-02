// Escaping for spec-supplied copy on its way into an emitted source file. A label and a
// placeholder are human words the spec author chose, and "Owner's name" is ordinary
// English; interpolated raw they close the emitted literal early and the generated file
// stops being valid source in whichever language received it. Every emitter routes a
// spec-supplied string through one of the two functions below.
//
// Control characters are not handled here because they cannot be escaped into a
// single-quoted TypeScript literal at all. validateSpec refuses them at the boundary.

/**
 * A single-quoted TypeScript string literal carrying `value`. Single-quoted rather than
 * JSON.stringify's double, so a label with no special character emits byte-identical text
 * to the users exemplar the emitters mirror.
 */
export function tsString(value: string): string {
  const escaped = value.split('\\').join('\\\\').split("'").join("\\'");
  return `'${escaped}'`;
}

/**
 * The body of an interpolated string literal: C#'s $"..." and the desktop shell's native
 * format!("...") escape it identically, so this is one function rather than two identical
 * ones, named for the shape rather than for either language. A brace opens an
 * interpolation hole so it doubles; a double quote or a backslash takes a backslash.
 */
export function interpolatedString(value: string): string {
  return value
    .split('\\').join('\\\\')
    .split('"').join('\\"')
    .split('{').join('{{')
    .split('}').join('}}');
}
