// Which gate steps a change actually needs.
//
// The full gate takes ~4 minutes and every commit paid it, prose included. This
// maps changed paths to subsystem areas, and each step declares the areas it can
// possibly be broken by, so a Rust-only change stops running Playwright and a
// CLAUDE.md edit stops running anything at all.
//
// Two directions of failure, and they are not symmetric. Running a step that was
// not needed costs seconds. NOT running a step that was needed lets a break reach
// main behind a green check, which is the whole thing the gate exists to prevent.
// So every ambiguity here resolves toward running more: an unrecognized path
// activates every area, and so does an empty change set.

/** The subsystems a step can be broken by. `docs` is deliberately not one — it is inert. */
export const ALL_AREAS = ['dotnet', 'rust', 'frontend', 'tools', 'contracts'] as const;

export type Area = (typeof ALL_AREAS)[number];

/** A step, reduced to what selection needs. The real table lives in verify.ts. */
export interface Selectable {
  name: string;
  areas: readonly Area[];
}

/**
 * The area a changed path belongs to, `docs` when it cannot break anything, or
 * `unknown` when this function does not recognise it.
 *
 * Order matters: the specific carve-outs come before the general rules that would
 * otherwise swallow them. Two of them are easy to get wrong and both were the
 * reason this function is tested at all.
 *
 * `docs/architecture/rules/` is NOT prose. `tools/hooks/rule-docs.test.ts` asserts
 * every lint rule has its doc, so deleting one turns the gate red with no code
 * touched — a blanket `*.md` skip would wave it through.
 *
 * `.bob/registry/` is NOT prose either, despite CATALOG.md's extension. It is a
 * generated artifact whose freshness is a gate step, and a diff that touches it
 * alone means either the generator's input moved or somebody hand-edited generated
 * output, which CLAUDE.md forbids. That is exactly when you want the check to run.
 */
export function classify(path: string): Area | 'docs' | 'unknown' {
  const p = path.replace(/\\/g, '/');

  // Generated wire contracts: their own area, because they need codegen freshness and a
  // type-check of the code consuming them, but no linting and no e2e.
  if (p.startsWith('contracts/openapi/')) return 'contracts';
  if (p.startsWith('frontend/src/app/contracts/generated/')) return 'contracts';

  if (p.startsWith('docs/architecture/rules/')) return 'tools';
  if (p.startsWith('.bob/registry/')) return 'tools';

  if (p.endsWith('.md')) return 'docs';
  if (p.startsWith('docs/')) return 'docs';
  if (p.startsWith('.bob/')) return 'docs';

  if (p.startsWith('services/')) return 'dotnet';
  if (p.startsWith('apps/')) return 'rust';
  if (p.startsWith('frontend/')) return 'frontend';
  if (p.startsWith('tools/')) return 'tools';
  if (p.startsWith('.github/')) return 'tools';
  if (p.startsWith('.githooks/')) return 'tools';

  return 'unknown';
}

/**
 * The areas a set of changed paths activates.
 *
 * Fails safe in both of its edge cases. An unclassifiable path is one this selector
 * cannot vouch for, so it activates everything rather than guessing. An empty list
 * means nobody told us what changed — the local `npm run verify` case — and that has
 * to stay the full gate, not an empty one.
 */
export function activeAreas(paths: readonly string[]): Set<Area> {
  if (paths.length === 0) return new Set(ALL_AREAS);

  const active = new Set<Area>();
  for (const path of paths) {
    const area = classify(path);
    if (area === 'docs') continue;
    if (area === 'unknown') return new Set(ALL_AREAS);
    active.add(area);
  }
  return active;
}

/** The steps to run, in their declared order, given the active areas. */
export function selectSteps<T extends Selectable>(steps: readonly T[], active: ReadonlySet<Area>): T[] {
  return steps.filter((step) => step.areas.some((area) => active.has(area)));
}
