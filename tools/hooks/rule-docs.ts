// Resolves an ESLint rule id fired by the jig plugin to the architecture document that
// explains it, by reading each rule's OWN meta.docs.url rather than hand-writing a second
// table that maps rule ids to doc paths.
//
// A hand-written table would restate a fact tools/lint/rule-docs.test.ts already enforces
// on every rule under tools/lint/rules — CLAUDE.md's DRY gate is explicit that no fact gets
// stated twice by hand. The plugin object built in tools/lint/index.ts is the one source;
// this file only reads it.
//
// ESLint reports rule ids plugin-prefixed ("jig/no-raw-control"), so the prefix is stripped
// before lookup. An id the plugin does not recognize (a typo, a rule from another plugin, a
// rule since removed) resolves to no url rather than a guessed path — a doc pointer nobody
// can follow is worse than no pointer at all.

import plugin from '../lint/index.ts';

/** The repo-relative doc path for one rule id, or undefined if the id is not recognized. */
export function docUrlFor(ruleId: string | null | undefined): string | undefined {
  if (!ruleId) return undefined;
  const name = ruleId.startsWith('jig/') ? ruleId.slice('jig/'.length) : ruleId;
  return (plugin.rules as Record<string, { meta?: { docs?: { url?: string } } }>)[name]?.meta?.docs
    ?.url;
}

/**
 * A short block pointing at the architecture document for each rule that fired, deduplicated
 * and in the order first seen. Unrecognized ids are silently omitted rather than turned into
 * a broken path. Returns an empty string when nothing resolves.
 */
export function docPointerBlock(ruleIds: (string | null | undefined)[]): string {
  const urls = [...new Set(ruleIds.map(docUrlFor).filter((u): u is string => Boolean(u)))];
  if (urls.length === 0) return '';
  return 'See:\n' + urls.map((u) => `  - ${u}`).join('\n');
}
