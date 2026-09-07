/**
 * A static `style="..."` attribute bypasses the design tokens entirely: it is
 * neither a utility class nor a component stylesheet token, so nothing in the
 * catalog governs its value. A bound `[style.foo]` is a different attribute
 * kind (a BoundAttribute, not a TextAttribute) and is left alone.
 */
export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A static style attribute bypasses the design tokens.',
      url: 'docs/architecture/rules/no-style-attribute.md',
    },
    schema: [],
    messages: {
      styleAttribute:
        'A static style="..." attribute bypasses the design tokens. ' +
        'Use a utility class, or a token in the component stylesheet. ' +
        'Good: <div class="grid gap-m">  Bad: <div style="display: grid; gap: 12px">',
    },
  },
  create(context) {
    return {
      TextAttribute(node) {
        if (node.name !== 'style') return;
        context.report({ node, messageId: 'styleAttribute' });
      },
    };
  },
};
