import { classOf, componentImports, decoratorMetadata, hasDecorator, metadataProperty, tierOf } from '../ast.ts';

/**
 * Container-tier only, for the same reason no-forms-module is: ReactiveFormsModule
 * is used in 17 files in this app and every one is legitimate — forms/schema-form.ts
 * builds a reactive FormGroup from a runtime schema by design
 * (docs/architecture/forms.md), and the showcase pages demo spartan controls
 * against reactive forms deliberately. features/ and shell/ have zero reactive
 * forms today, so this rule is prevention. See docs/architecture/rules/no-reactive-form.md.
 */
export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A container component does not build a reactive form by hand. Signal-forms owns known forms.',
      url: 'docs/architecture/rules/no-reactive-form.md',
    },
    schema: [],
    messages: {
      reactiveForm:
        'ReactiveFormsModule and a hand-built FormGroup are the dynamic-renderer API, reserved ' +
        'for forms/schema-form.ts rendering an unknown runtime schema. A feature form is known at ' +
        'compile time, so it uses signal-forms instead. ' +
        'Good: form(this.model, (path) => validateStandardSchema(path, userFormSchema))  ' +
        'Bad: imports: [ReactiveFormsModule] with new FormGroup({ ... }). ' +
        'Copy frontend/src/app/features/users/user-form.ts.',
    },
  },
  create(context) {
    if (tierOf(context.filename) !== 'container') return {};

    // Both triggers are the same defect — reactive forms hand-built in a
    // container — so one component reports once no matter how many
    // ReactiveFormsModule imports or FormGroup constructions it contains.
    const reported = new Set();
    const reportOnce = (cls, node) => {
      if (reported.has(cls)) return;
      reported.add(cls);
      context.report({ node, messageId: 'reactiveForm' });
    };

    return {
      'ClassDeclaration, ClassExpression'(node) {
        const metadata = decoratorMetadata(node, 'Component');
        if (metadata === null) return;
        if (componentImports(metadata, 'ReactiveFormsModule')) {
          reportOnce(node, metadataProperty(metadata, 'imports') ?? metadata);
        }
      },
      NewExpression(node) {
        if (node.callee?.name !== 'FormGroup') return;
        const cls = classOf(node);
        if (cls === null || !hasDecorator(cls, 'Component')) return;
        reportOnce(cls, node);
      },
    };
  },
};
