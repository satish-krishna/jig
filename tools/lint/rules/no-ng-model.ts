export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'No ngModel. The schema renderer and signal-forms own binding, not template-driven forms.',
      url: 'docs/architecture/rules/no-ng-model.md',
    },
    schema: [],
    messages: {
      ngModel:
        'ngModel is the template-driven forms API. This app validates through a zod schema — ' +
        'forms/schema-form.ts renders it by default, and signal-forms is the exception for a form ' +
        'whose fields you bind one by one. ' +
        'Good: <app-schema-form [schema]="userFormSchema" />, or [formField]="form.name" in a ' +
        'signal form.  Bad: [(ngModel)]="name". ' +
        'Copy frontend/src/app/features/users/user-form.ts.',
    },
  },
  create(context) {
    return {
      Element(node) {
        // Bare `ngModel` parses as a plain attribute; `[ngModel]` and the
        // `[(ngModel)]` banana-in-a-box both parse as a bound input named
        // ngModel (the box also adds an `ngModelChange` output, which this
        // rule does not need to check separately).
        for (const attr of node.attributes ?? []) {
          if (attr.name === 'ngModel') context.report({ node: attr, messageId: 'ngModel' });
        }
        for (const input of node.inputs ?? []) {
          if (input.name === 'ngModel') context.report({ node: input, messageId: 'ngModel' });
        }
      },
    };
  },
};
