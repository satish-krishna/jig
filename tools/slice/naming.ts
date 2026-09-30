// Small naming helpers shared across emitters for the vertical-slice generator (frontend
// production and frontend test). Kept separate from emit-frontend.ts so its test-emitter
// sibling does not have to import that file's internals for a two-line function, mirroring
// how csharp.ts holds the shared C#-naming helpers.

/**
 * Split a name given in Pascal/camel/kebab/snake/spaced form into its words. Lives here, not
 * in tools/init, because init deletes tools/init from every app it creates and the slice
 * generator has to keep working there; template init imports it from here instead.
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
