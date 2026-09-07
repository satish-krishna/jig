const BANNED = new Set(['ngClass', 'ngStyle']);

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'No ngClass or ngStyle.',
      url: 'docs/architecture/rules/no-ng-class-style.md',
    },
    schema: [],
    messages: {
      ngClassStyle:
        '{{name}} hides the class list from every static check, including this gate. ' +
        'Use a class binding. ' +
        'Good: <div [class.is-open]="open()">  Bad: <div [ngClass]="{ \'is-open\': open() }">',
    },
  },
  create(context) {
    const report = (node, name) => context.report({ node, messageId: 'ngClassStyle', data: { name } });
    return {
      Element(node) {
        for (const attr of node.attributes ?? []) if (BANNED.has(attr.name)) report(attr, attr.name);
        for (const input of node.inputs ?? []) if (BANNED.has(input.name)) report(input, input.name);
      },
    };
  },
};
