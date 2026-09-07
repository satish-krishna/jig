import { classAttribute, baseUtility } from '../ast.ts';
import { attributeSelectors, elementSelectors } from '../vocabulary.ts';

/**
 * Appearance is color, typography, decoration, and INTERNAL padding. Layout,
 * dimensions, margin and position are deliberately absent: spartan's own styling
 * doc draws this line, and this rule enforces that line rather than inventing one.
 */
const APPEARANCE = [
  /^bg-/, /^font-/, /^leading-/, /^tracking-/,
  /^border$/, /^border-/, /^rounded$/, /^rounded-/,
  /^shadow$/, /^shadow-/, /^ring$/, /^ring-/,
  /^p[xytblre]?-/,
];

/** text-left / text-center / text-right / text-justify are alignment, not typography. */
const ALIGNMENT = new Set(['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end']);
const isText = (u: string) => /^text-/.test(u) && !ALIGNMENT.has(u);

const isAppearance = (cls: string) => {
  const u = baseUtility(cls);
  return isText(u) || APPEARANCE.some((re) => re.test(u));
};

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: "Do not override a primitive's appearance at the call site.",
      url: 'docs/architecture/rules/no-appearance-on-primitive.md',
    },
    schema: [],
    messages: {
      appearanceOnPrimitive:
        "'{{cls}}' overrides the appearance of a primitive at the call site. " +
        'Layout, dimensions, margin and position are fine here; color, typography, ' +
        'decoration and internal padding belong in libs/ui or in a token. ' +
        'Good: <button hlmBtn class="w-full">  Bad: <button hlmBtn class="bg-muted">',
    },
  },
  create(context) {
    const attrs = attributeSelectors();
    const els = elementSelectors();

    return {
      Element(node) {
        const carriesPrimitive =
          els.has(node.name) ||
          (node.attributes ?? []).some((a) => attrs.has(a.name));
        if (!carriesPrimitive) return;

        for (const cls of classAttribute(node)) {
          if (isAppearance(cls)) {
            context.report({ node, messageId: 'appearanceOnPrimitive', data: { cls } });
          }
        }
      },
    };
  },
};
