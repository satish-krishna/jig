/**
 * Data for the US English gate (see `us-english.test.ts`).
 *
 * This module is the one file that test excludes from its own scan — not as
 * a convenience exception, but because its content necessarily IS the very
 * strings the gate looks for: a stem list has to spell out each British
 * spelling verbatim to check text against it. That is a different thing
 * from an exception granted because a hit is inconvenient to fix. Keep this
 * file to data plus the minimum comment needed to justify each entry; put
 * discussion of the gate's design in `us-english.test.ts` instead, in words
 * that do not themselves need to spell out a banned form.
 */

/**
 * Stems, not whole words: "colour" also catches "colours"/"coloured".
 *
 * analyse/paralyse, not an analys/paralys prefix: analys also matches the
 * correctly spelled noun analysis/analyses (US and UK spell the noun
 * identically; only the verb differs). A prefix that flags a correct
 * spelling gets suppressed, not fixed.
 *
 * Not exhaustive English-wide — only what this repo has used or would
 * plausibly reach for. labell was added after confirming labelled/labelling
 * occur in the tree; grey, whilst, amongst, fulfil, enrol, skilful,
 * practise, programme, storey, manoeuvre, and sceptic were checked and do
 * not occur anywhere in the tree, so they are not listed.
 */
export const STEMS = [
  'colour',
  'behaviour',
  'favour',
  'labour',
  'neighbour',
  'honour',
  'centre',
  'metre',
  'litre',
  'theatre',
  'initialis',
  'organis',
  'recognis',
  'customis',
  'optimis',
  'summaris',
  'prioritis',
  'utilis',
  'normalis',
  'serialis',
  'visualis',
  'authoris',
  'categoris',
  'apologis',
  'analyse',
  'paralyse',
  'licence',
  'defence',
  'offence',
  'pretence',
  'catalogue',
  'dialogue',
  'travelling',
  'cancelled',
  'modelling',
  'labell',
];

/**
 * The "-ise" verb family: a bare stem like "optimis" is also the first
 * seven letters of the correctly spelled, unrelated words "optimistic" and
 * "optimism" — same problem `analys` had against `analysis` before Ruling
 * 18A, just not noticed the first time. Every real inflection of these
 * stems (organise/organised/organising/organisation, and so on for the
 * rest) is followed by "a", "e", or "i"; "optimistic" continues with "t",
 * "organism" with "m". Members of this set get a same-file continuation
 * check in `us-english.test.ts` requiring one of those three letters next,
 * which keeps every real British inflection while rejecting both unrelated
 * words. `analyse`/`paralyse` are not in this set: they are matched as
 * complete words already, not as prefixes, so no continuation check
 * applies to them.
 */
export const ISE_VERB_STEMS = new Set([
  'initialis',
  'organis',
  'recognis',
  'customis',
  'optimis',
  'summaris',
  'prioritis',
  'utilis',
  'normalis',
  'serialis',
  'visualis',
  'authoris',
  'categoris',
  'apologis',
]);

/**
 * Per-stem regex overrides for stems whose default case-sensitive match
 * would still hit something other than a spelling violation.
 *
 * labell alone also matches inside the W3C ARIA attribute name
 * "aria-labelledby" — emitted verbatim by the generated showcase
 * component-API file, sourced from the vendored, never-hand-edited UI kit.
 * Excluding a leading "aria-" keeps that name untouched while still
 * catching real prose use of the word.
 *
 * analyse/paralyse are matched as complete words, not as ISE_VERB_STEMS
 * prefixes, but "analyse"/"paralyse" plus a trailing "s" is also exactly
 * how the correctly spelled plural nouns "analyses"/"paralyses" are
 * spelled (identically in US and UK — the same Greek -sis/-ses pattern as
 * "analysis"/"paralysis", which is why Ruling 18A excluded those in the
 * first place). Excluding a word-final "s" keeps every real inflection
 * (analysed, analysing, analyser, analysers, and their paralyse
 * equivalents) while letting the ambiguous plural noun through.
 */
export const PATTERN_OVERRIDES: Record<string, RegExp> = {
  labell: /(?<!aria-)(?:labell|Labell)/g,
  analyse: /(?:analyse|Analyse)(?!s\b)/g,
  paralyse: /(?:paralyse|Paralyse)(?!s\b)/g,
};

/**
 * Fixtures for the matcher tests in `us-english.test.ts`. Necessarily
 * literal for the same reason `STEMS` is: exercising the matcher means
 * feeding it real banned spellings and real unrelated words that happen to
 * share a prefix with one.
 */
export const CLEAN_EXAMPLES = [
  'optimistic',
  'optimism',
  'organism',
  'analysis',
  'analyses',
  'paralysis',
  'paralyses',
  'userIsAdmin',
  'customIsValid',
  'authorIsOwner',
];

export const DIRTY_EXAMPLES = ['optimise', 'optimisation', 'organise', 'organisation', 'analyse', 'customise', 'Customisation'];

/**
 * Narrow, named file+stem exceptions — each one an upstream quotation, not
 * a spelling bug. Format: "<repo-relative path>:<stem>".
 *
 * The one entry below names a design doc that quotes an external sibling
 * project's (Kata's) published wire-protocol event name verbatim. Renaming
 * it would make the doc wrong about what the upstream system actually
 * emits.
 */
export const FILE_STEM_EXCEPTIONS = new Set(['docs/superpowers/specs/2026-07-03-agent-streaming-design.md:cancelled']);

/**
 * Independently retyped pin for the test asserting the set above has not
 * silently grown — the same pattern `us-english.test.ts` uses to pin
 * `EXCLUDED_FILES`, just relocated here because the expected value quotes
 * a banned stem and this is the one file that scan does not itself cover.
 * Written separately from the Set literal above on purpose: if someone
 * adds a second exception here without also updating this list, the
 * pinning test catches the mismatch instead of the widening passing
 * unnoticed.
 */
export const EXPECTED_FILE_STEM_EXCEPTIONS = ['docs/superpowers/specs/2026-07-03-agent-streaming-design.md:cancelled'];
