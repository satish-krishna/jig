export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: '(ngSubmit) with no [formGroup] is template-driven forms leaking in through NgForm.',
      url: 'docs/architecture/rules/no-orphan-ng-submit.md',
    },
    schema: [],
    messages: {
      orphanNgSubmit:
        '(ngSubmit) with no [formGroup] on the same element binds to the template-driven NgForm ' +
        'directive, not the reactive FormGroupDirective. This app has no template-driven forms — ' +
        'signal-forms submits through the native (submit) event instead. ' +
        'Good: <form [formGroup]="form()" (ngSubmit)="onSubmit()">  ' +
        'Bad: <form (ngSubmit)="onSubmit()"> with no [formGroup]. ' +
        'Copy frontend/src/app/forms/schema-form.ts.',
    },
  },
  create(context) {
    return {
      Element(node) {
        const hasNgSubmit = (node.outputs ?? []).some((output) => output.name === 'ngSubmit');
        if (!hasNgSubmit) return;

        const hasFormGroup = (node.inputs ?? []).some((input) => input.name === 'formGroup');
        if (hasFormGroup) return;

        context.report({ node, messageId: 'orphanNgSubmit' });
      },
    };
  },
};
