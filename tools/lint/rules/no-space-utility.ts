import { classAttribute, baseUtility } from '../ast.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Gap belongs on the container.',
      url: 'docs/architecture/rules/no-space-utility.md',
    },
    schema: [],
    messages: {
      spaceUtility:
        "'{{cls}}' spaces children by injecting margins into them. Put the gap on the " +
        'container instead, where the layout is stated once and reads in one place. ' +
        'Good: <div class="grid gap-s">  Bad: <div class="space-y-2">',
    },
  },
  create(context) {
    return {
      Element(node) {
        for (const cls of classAttribute(node)) {
          if (/^space-[xy]-/.test(baseUtility(cls))) {
            context.report({ node, messageId: 'spaceUtility', data: { cls } });
          }
        }
      },
    };
  },
};
