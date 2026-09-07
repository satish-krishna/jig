const LEGACY = ['ngIf', 'ngFor', 'ngForOf', 'ngSwitch', 'ngSwitchCase', 'ngSwitchDefault'];

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Use built-in control flow.',
      url: 'docs/architecture/rules/no-legacy-control-flow.md',
    },
    schema: [],
    messages: {
      // The Good/Bad examples deliberately avoid Angular's own interpolation
      // syntax (double curly braces): ESLint's message interpolation uses the
      // identical {{ }} marker, and a literal "{{ user.name }}" in the message
      // text is parsed as an unresolved placeholder rather than shown as-is.
      legacyControlFlow:
        '*{{directive}} is the legacy control flow. Use the built-in block. ' +
        'Good: @if (user) { <p>Welcome</p> }  Bad: <p *ngIf="user">Welcome</p>',
    },
  },
  create(context) {
    return {
      Template(node) {
        for (const attr of node.templateAttrs ?? []) {
          if (LEGACY.includes(attr.name)) {
            context.report({ node, messageId: 'legacyControlFlow', data: { directive: attr.name } });
            return;
          }
        }
      },
    };
  },
};
