import noLiteralSpacing from './rules/no-literal-spacing.ts';

/**
 * The `jig` ESLint plugin. Rules are added here as they are written.
 *
 * Planned, not yet built: a config-completeness test that asserts every rule
 * file in rules/ is enabled at error in frontend/eslint.config.mjs, so a rule
 * that is written and never wired fails the suite rather than sitting dormant.
 * That test does not exist today — wiring a new rule into eslint.config.mjs is
 * a manual step with no gate behind it, and it lands in a later branch.
 */
export default {
  rules: {
    'no-literal-spacing': noLiteralSpacing,
  },
};
