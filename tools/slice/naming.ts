// The vertical-slice generator's shared naming helpers: casing, word splitting, articles and
// labels, used by the spec, every emitter, the injectors and template init. Kept apart from
// any one emitter so none has to import another's internals, as csharp.ts does for C# names.

/** "A" or "An", by the first sound of the noun that follows. */
export function articleFor(word: string): 'A' | 'An' {
  // By sound, not letter: a vowel that sounds like "you" or "wo" takes "a" (a user, a unit,
  // a one-off), and a silent h takes "an" (an hour). An un- prefix before an n (uninstaller)
  // keeps its vowel sound.
  if (/^(uni(?!n)|use|usa|usu|uti|ure|eu|one|once)/i.test(word)) return 'A';
  if (/^(hour|honest|honor|heir)/i.test(word)) return 'An';
  return /^[aeiou]/i.test(word) ? 'An' : 'A';
}

/**
 * Split a name given in Pascal/camel/kebab/snake/spaced form into its words. It lives here
 * because the slice generator needs it in every app, including after template init has
 * removed its own tooling; template init imports it from here.
 */
export function words(raw: string): string[] {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean);
}

/** Any casing -> snake_case, e.g. "PurchaseOrder" -> "purchase_order", "firstName" -> "first_name". */
export function snake(name: string): string {
  return words(name).map((w) => w.toLowerCase()).join('_');
}

/**
 * snake_case -> camelCase the way serde's `rename_all = "camelCase"` does it: drop each
 * underscore and capitalize the letter after it. The desktop store relies on
 * `camelFromSnake(snake(name)) === name` to put a field on the wire under the name the API uses.
 */
export function camelFromSnake(name: string): string {
  return name.replace(/_(.)/g, (_, c: string) => c.toUpperCase());
}

/** Capitalize the first letter only, for a heading: "purchase orders" -> "Purchase orders". */
export function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** kebab-case, hyphen-joined -> space-joined words, for a human-facing label. */
export function label(kebab: string): string {
  return kebab.replace(/-/g, ' ');
}
