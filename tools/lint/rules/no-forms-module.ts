import { decoratorMetadata, componentImports, metadataProperty, tierOf } from '../ast.ts';

/**
 * Container-tier only. ReactiveFormsModule and FormsModule are legitimate
 * everywhere else — forms/schema-form.ts is the dynamic renderer and is
 * reactive by design (docs/architecture/forms.md), and the showcase pages
 * demo spartan controls against reactive forms deliberately, with explanatory
 * copy. See docs/architecture/rules/no-forms-module.md.
 */
export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A container component does not import FormsModule. Signal-forms owns known forms.',
      url: 'docs/architecture/rules/no-forms-module.md',
    },
    schema: [],
    messages: {
      formsModule:
        'FormsModule is the template-driven forms API. This app uses signal-forms with a zod ' +
        'schema as the single source of truth. ' +
        'Good: form(this.model, (path) => validateStandardSchema(path, userFormSchema))  ' +
        'Bad: imports: [FormsModule] with [(ngModel)] in the template. ' +
        'Copy frontend/src/app/features/users/user-form.ts.',
    },
  },
  create(context) {
    if (tierOf(context.filename) !== 'container') return {};

    return {
      'ClassDeclaration, ClassExpression'(node) {
        const metadata = decoratorMetadata(node, 'Component');
        if (metadata === null) return;
        if (!componentImports(metadata, 'FormsModule')) return;

        context.report({ node: metadataProperty(metadata, 'imports') ?? metadata, messageId: 'formsModule' });
      },
    };
  },
};
