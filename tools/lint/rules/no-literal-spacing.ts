import { SPACING_STEPS } from '../../design-tokens/spacing.ts';

/**
 * The utility families this rule governs. `gap-x`/`gap-y` must precede the bare
 * `gap` because regex alternation tries alternatives left-to-right and stops at
 * the first that completes the overall match: `gap` followed by a literal `-`
 * already satisfies `^(alt)-(.+)$` for input like `gap-y-l`, so without this
 * ordering the value would be misread as `y-l` instead of `l`. The `p`/`m`
 * families need no such ordering because their single-letter members (`p`, `m`)
 * are never immediately followed by `-` in a fused variant (`px`, `mt`, ...), so
 * there is no overlap to break the alternation.
 */
export const SPACING_PREFIXES = [
  'gap-x', 'gap-y', 'gap',
  'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe',
  'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'ms', 'me',
];

// Widened to Set<string>: the value under test is a regex capture group, a
// plain string, never one of the literal step names on its own account.
const NAMED = new Set<string>(SPACING_STEPS.map((s) => s.name));

/** Values that are not a step on any scale and therefore need no token. */
const EXEMPT = new Set(['0', 'auto', 'px']);

// The leading `-?` covers a negative margin (`-mt-2`, `-mx-4`), Tailwind's
// idiom for pulling an element outward. `gap` has no negative form, but the
// prefix is shared with `m`/`p` in SPACING_PREFIXES, so this stays permissive
// there rather than special-casing which families accept a leading `-`.
const PATTERN = new RegExp(`^-?(${SPACING_PREFIXES.join('|')})-(.+)$`);

/**
 * True when the class is a spacing utility carrying a literal rather than a
 * named step. Responsive and state prefixes are stripped first, so sm:gap-2 and
 * dark:hover:p-4 are both decided on their base utility.
 */
export function isLiteralSpacingClass(cls) {
  const base = cls.slice(cls.lastIndexOf(':') + 1);
  const match = PATTERN.exec(base);
  if (match === null) return false;

  const value = match[2];
  if (EXEMPT.has(value)) return false;
  if (NAMED.has(value)) return false;
  return true;
}

const SUGGESTION = SPACING_STEPS.map((s) => `${s.name} (${s.px}px)`).join(', ');

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Spacing utilities must use a named token step, not a literal.',
      url: 'docs/architecture/rules/no-literal-spacing.md',
    },
    schema: [],
    messages: {
      literalSpacing:
        "'{{cls}}' is a spacing literal. Use a named step so spacing is uniform across components. Steps: " +
        SUGGESTION +
        '. See docs/architecture/rules/no-literal-spacing.md',
    },
  },
  create(context) {
    return {
      TextAttribute(node) {
        if (node.name !== 'class' || typeof node.value !== 'string') return;

        for (const cls of node.value.split(/\s+/).filter(Boolean)) {
          if (isLiteralSpacingClass(cls)) {
            context.report({ node, messageId: 'literalSpacing', data: { cls } });
          }
        }
      },
    };
  },
};
