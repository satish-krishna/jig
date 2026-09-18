// Small naming helpers shared across emitters for the vertical-slice generator (frontend
// production and frontend test). Kept separate from emit-frontend.ts so its test-emitter
// sibling does not have to import that file's internals for a two-line function, mirroring
// how csharp.ts holds the shared C#-naming helpers.

/** kebab-case, hyphen-joined -> space-joined words, for a human-facing label. */
export function label(kebab: string): string {
  return kebab.replace(/-/g, ' ');
}
