import { NATIVE_TO_PRIMITIVE } from '../vocabulary.ts';

const attributeNames = (node) => new Set((node.attributes ?? []).map((a) => a.name)
  .concat((node.inputs ?? []).map((i) => i.name)));

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A native control must carry a primitive when one exists for it.',
      url: 'docs/architecture/rules/no-raw-control.md',
    },
    schema: [],
    messages: {
      rawControl:
        '<{{tag}}> is a raw control and libs/ui ships a primitive for it. ' +
        'Add one of: {{options}}. ' +
        'Good: <{{tag}} {{first}}>...</{{tag}}>  Bad: <{{tag}}>...</{{tag}}>',
    },
  },
  create(context) {
    return {
      Element(node) {
        const primitives = NATIVE_TO_PRIMITIVE[node.name];
        if (primitives === undefined) return;

        // Any ONE listed primitive satisfies the rule: several helm directives
        // style the same native element in different compositions.
        const present = attributeNames(node);
        if (primitives.some((p) => present.has(p))) return;

        context.report({
          node,
          messageId: 'rawControl',
          data: { tag: node.name, options: primitives.join(', '), first: primitives[0] },
        });
      },
    };
  },
};
