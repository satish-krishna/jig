import { classOf, hasDecorator, importedFrom } from '../ast.ts';

const SIGNAL_FORMS = '@angular/forms/signals';
const VALIDATORS = new Set(['required', 'minLength', 'maxLength', 'min', 'max', 'email', 'pattern']);

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A signal-forms validator does not restate a rule the zod schema already carries.',
      url: 'docs/architecture/rules/no-restated-validator.md',
    },
    schema: [],
    messages: {
      restatedValidator:
        "'{{name}}()' restates a rule the zod schema already carries. Validation flows through " +
        'validateStandardSchema, so the schema stays the one place a rule is written. ' +
        'Good: userFormSchema with .min(1, "Name is required")  Bad: required(path.name)',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const name = node.callee?.name;
        if (name === undefined || !VALIDATORS.has(name)) return;
        if (importedFrom(context, name) !== SIGNAL_FORMS) return;

        const cls = classOf(node);
        if (cls === null || !hasDecorator(cls, 'Component')) return;

        context.report({ node, messageId: 'restatedValidator', data: { name } });
      },
    };
  },
};
