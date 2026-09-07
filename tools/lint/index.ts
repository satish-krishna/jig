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
import noRawPaletteColor from './rules/no-raw-palette-color.ts';
import noSpaceUtility from './rules/no-space-utility.ts';
import noNestedFlexGrid from './rules/no-nested-flex-grid.ts';
import noFormsModule from './rules/no-forms-module.ts';
import noReactiveForm from './rules/no-reactive-form.ts';
import noRestatedValidator from './rules/no-restated-validator.ts';
import noNgModel from './rules/no-ng-model.ts';
import noOrphanNgSubmit from './rules/no-orphan-ng-submit.ts';
import noLegacyIconModule from './rules/no-legacy-icon-module.ts';
import noUnregisteredIcon from './rules/no-unregistered-icon.ts';
import noStateOutsideViewModel from './rules/no-state-outside-view-model.ts';
import noComponentSubscribe from './rules/no-component-subscribe.ts';
import noRootProvidedViewModel from './rules/no-root-provided-view-model.ts';
import noUnprovidedViewModel from './rules/no-unprovided-view-model.ts';
import noFeatureInjectData from './rules/no-feature-inject-data.ts';

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
    'no-raw-palette-color': noRawPaletteColor,
    'no-space-utility': noSpaceUtility,
    'no-nested-flex-grid': noNestedFlexGrid,
    'no-forms-module': noFormsModule,
    'no-reactive-form': noReactiveForm,
    'no-restated-validator': noRestatedValidator,
    'no-ng-model': noNgModel,
    'no-orphan-ng-submit': noOrphanNgSubmit,
    'no-legacy-icon-module': noLegacyIconModule,
    'no-unregistered-icon': noUnregisteredIcon,
    'no-state-outside-view-model': noStateOutsideViewModel,
    'no-component-subscribe': noComponentSubscribe,
    'no-root-provided-view-model': noRootProvidedViewModel,
    'no-unprovided-view-model': noUnprovidedViewModel,
    'no-feature-inject-data': noFeatureInjectData,
  },
};
