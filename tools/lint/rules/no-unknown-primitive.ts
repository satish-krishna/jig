import { attributeSelectors, elementSelectors } from '../vocabulary.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'An hlm attribute or element must match an installed selector, in that form.',
      url: 'docs/architecture/rules/no-unknown-primitive.md',
    },
    schema: [],
    messages: {
      unknownPrimitive:
        "'{{name}}' matches no installed primitive in that form. " +
        'Check the spelling, and check whether it is an attribute directive or an element — ' +
        'writing the right name in the wrong form is the usual cause. ' +
        'The installed set is generated into showcase/component-api.generated.ts.',
    },
  },
  create(context) {
    const attrs = attributeSelectors();
    const els = elementSelectors();

    return {
      Element(node) {
        if (/^hlm-/.test(node.name) && !els.has(node.name)) {
          context.report({ node, messageId: 'unknownPrimitive', data: { name: node.name } });
        }

        for (const attr of node.attributes ?? []) {
          const looksPrimitive = /^hlm[A-Z]/.test(attr.name) || /^hlm-/.test(attr.name);
          if (looksPrimitive && !attrs.has(attr.name)) {
            context.report({ node: attr, messageId: 'unknownPrimitive', data: { name: attr.name } });
          }
        }
      },
    };
  },
};
