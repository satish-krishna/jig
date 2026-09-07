import { decoratorMetadata, metadataProperty } from '../ast.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Do not set changeDetection in @Component. OnPush is the Angular v22 default.',
      url: 'docs/architecture/rules/no-hand-set-change-detection.md',
    },
    schema: [],
    messages: {
      handSetChangeDetection:
        'Do not set `changeDetection` in @Component at all — OnPush is the Angular v22 default. ' +
        "Good: @Component({ selector: 'app-x', template: `...` })  " +
        "Bad: @Component({ selector: 'app-x', changeDetection: ChangeDetectionStrategy.OnPush })",
    },
  },
  create(context) {
    return {
      'ClassDeclaration, ClassExpression'(node) {
        const metadata = decoratorMetadata(node, 'Component');
        if (metadata === null) return;

        const prop = metadataProperty(metadata, 'changeDetection');
        if (prop !== null) context.report({ node: prop, messageId: 'handSetChangeDetection' });
      },
    };
  },
};
