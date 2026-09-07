import { decoratorMetadata, componentImports, metadataProperty } from '../ast.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'NgIconsModule is the legacy NgModule icon API. Register glyphs with provideIcons instead.',
      url: 'docs/architecture/rules/no-legacy-icon-module.md',
    },
    schema: [],
    messages: {
      legacyIconModule:
        'NgIconsModule is the legacy NgModule-based icon API. This app registers glyphs with ' +
        'provideIcons and renders them with <ng-icon>, per frontend/src/app/app.config.ts. ' +
        'Good: providers: [provideIcons({ lucideUsers })]  Bad: imports: [NgIconsModule]',
    },
  },
  create(context) {
    return {
      'ClassDeclaration, ClassExpression'(node) {
        const metadata = decoratorMetadata(node, 'Component');
        if (metadata === null) return;
        if (!componentImports(metadata, 'NgIconsModule')) return;

        context.report({ node: metadataProperty(metadata, 'imports') ?? metadata, messageId: 'legacyIconModule' });
      },
    };
  },
};
