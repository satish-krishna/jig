export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Icons come from the registry, not pasted SVG.',
      url: 'docs/architecture/rules/no-raw-icon.md',
    },
    schema: [],
    messages: {
      rawIcon:
        'A pasted <svg> is an icon outside the registry. Use <ng-icon name="lucideX" /> and ' +
        'register the glyph with provideIcons. ' +
        'Good: <ng-icon name="lucideUsers" />  Bad: <svg viewBox="0 0 24 24">...</svg>',
    },
  },
  create(context) {
    return {
      // Exactly ":svg:svg" — matching a prefix would report every namespaced
      // descendant of one pasted icon.
      'Element[name=":svg:svg"]'(node) {
        context.report({ node, messageId: 'rawIcon' });
      },
    };
  },
};
