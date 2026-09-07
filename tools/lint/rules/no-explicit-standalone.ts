import { decoratorMetadata, metadataProperty } from '../ast.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Do not set standalone in @Component. It is the Angular v19+ default.',
      url: 'docs/architecture/rules/no-explicit-standalone.md',
    },
    schema: [],
    messages: {
      explicitStandalone:
        'Do not set `standalone` in @Component at all — standalone is the default. ' +
        "Good: @Component({ selector: 'app-x', template: `...` })  " +
        "Bad: @Component({ selector: 'app-x', standalone: true, template: `...` })",
    },
  },
  create(context) {
    return {
      'ClassDeclaration, ClassExpression'(node) {
        const metadata = decoratorMetadata(node, 'Component');
        if (metadata === null) return;

        const prop = metadataProperty(metadata, 'standalone');
        if (prop !== null) context.report({ node: prop, messageId: 'explicitStandalone' });
      },
    };
  },
};
