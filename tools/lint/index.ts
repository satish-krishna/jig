import noLiteralSpacing from './rules/no-literal-spacing.ts';
import noExplicitStandalone from './rules/no-explicit-standalone.ts';
import noHandSetChangeDetection from './rules/no-hand-set-change-detection.ts';
import noRawControl from './rules/no-raw-control.ts';
import noUnknownPrimitive from './rules/no-unknown-primitive.ts';
import noAppearanceOnPrimitive from './rules/no-appearance-on-primitive.ts';
import noStyleAttribute from './rules/no-style-attribute.ts';
import noRawIcon from './rules/no-raw-icon.ts';
import noMissingCompositionPart from './rules/no-missing-composition-part.ts';
import noLegacyControlFlow from './rules/no-legacy-control-flow.ts';
import noNgClassStyle from './rules/no-ng-class-style.ts';

/**
 * The `jig` ESLint plugin. Rules are added here as they are written.
 *
 * Two meta-gates hold every rule registered below to the same standard:
 * `rule-docs.test.ts` asserts each rule file here is exported from this
 * plugin, has a document under docs/architecture/rules/, and declares
 * meta.docs.url pointing at it; `config-completeness.test.ts` asserts each
 * registered rule is enabled at error in frontend/eslint.config.mjs. A rule
 * that is written and never wired, or written and never documented, now
 * fails the suite instead of sitting dormant.
 */
export default {
  rules: {
    'no-literal-spacing': noLiteralSpacing,
    'no-explicit-standalone': noExplicitStandalone,
    'no-hand-set-change-detection': noHandSetChangeDetection,
    'no-raw-control': noRawControl,
    'no-unknown-primitive': noUnknownPrimitive,
    'no-appearance-on-primitive': noAppearanceOnPrimitive,
    'no-style-attribute': noStyleAttribute,
    'no-raw-icon': noRawIcon,
    'no-missing-composition-part': noMissingCompositionPart,
    'no-legacy-control-flow': noLegacyControlFlow,
    'no-ng-class-style': noNgClassStyle,
  },
};
