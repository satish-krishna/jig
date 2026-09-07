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
 * Per-stem regex overrides for stems whose plain substring match would also
 * hit a fixed, unrenamable API name.
 *
 * labell alone also matches inside the W3C ARIA attribute name
 * "aria-labelledby" — emitted verbatim by the generated showcase
 * component-API file, sourced from the vendored, never-hand-edited UI kit.
 * Excluding a leading "aria-" keeps that name untouched while still
 * catching real prose use of the word.
 */
export const PATTERN_OVERRIDES: Record<string, RegExp> = {
  labell: /(?<!aria-)labell/gi,
};

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
