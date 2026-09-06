/**
 * The app-authored spacing scale, in one place because two engines read it: the
 * token test below and the no-literal-spacing ESLint rule, which builds its
 * allowed-suffix set from these names.
 *
 * Six steps on a 4px grid, derived from the nine magnitudes the app used before
 * the migration rather than invented. libs/ui keeps spartan's half-steps; see
 * ADR 0011 for why that split is accepted.
 *
 * Two of the nine source magnitudes sat exactly equidistant between grid
 * lines: 6px snapped down to `xs` (4px), 10px snapped up to `m` (12px). See
 * ADR 0011 for why that is not a general tie-break rule — decide a future
 * exact-midpoint value explicitly rather than assuming these two set one.
 */
export const SPACING_STEPS = [
  { name: 'xs', rem: '0.25rem', px: 4 },
  { name: 's', rem: '0.5rem', px: 8 },
  { name: 'm', rem: '0.75rem', px: 12 },
  { name: 'l', rem: '1rem', px: 16 },
  { name: 'xl', rem: '1.5rem', px: 24 },
  { name: '2xl', rem: '2rem', px: 32 },
] as const;

/** Every `--spacing-*` custom property declared in the given CSS, name to value. */
export function readSpacingTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of css.matchAll(/(--spacing-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[match[1]] = match[2].trim();
  }
  return out;
}
