import noLiteralSpacing from './rules/no-literal-spacing.mjs';

/**
 * The `jig` ESLint plugin. Rules are added here as they are written; the
 * config-completeness test asserts every rule file in rules/ is enabled at error
 * in frontend/eslint.config.mjs, so a rule that is written and never wired fails
 * the suite rather than sitting dormant.
 */
export default {
  rules: {
    'no-literal-spacing': noLiteralSpacing,
  },
};
