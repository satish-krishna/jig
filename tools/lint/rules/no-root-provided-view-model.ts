import { decoratorMetadata, metadataProperty } from '../ast.ts';

/** True when a class name ends in the ViewModel suffix this codebase uses for the pattern. */
const isViewModelName = (name) => typeof name === 'string' && name.endsWith('ViewModel');

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A ViewModel is provided by the component that owns it, never at the root.',
      url: 'docs/architecture/rules/no-root-provided-view-model.md',
    },
    schema: [],
    messages: {
      rootProvidedViewModel:
        "'{{name}}' is a ViewModel declared with providedIn: 'root'. A root-provided ViewModel is " +
        'a singleton shared by every consumer, which reintroduces the shared-mutable-state problem ' +
        'the ViewModel pattern exists to avoid: two views of the same feature would fight over one ' +
        'instance. A ViewModel is scoped to the component that opens it instead. ' +
        "Good: @Injectable() class {{name}} { ... } with @Component({ providers: [{{name}}] }). " +
        "Bad: @Injectable({ providedIn: 'root' }) class {{name}} { ... }. " +
        'Copy frontend/src/app/features/users/user-list.view-model.ts and ' +
        'frontend/src/app/features/users/user-list.view.ts.',
    },
  },
  create(context) {
    return {
      'ClassDeclaration, ClassExpression'(node) {
        const name = node.id?.name ?? null;
        if (!isViewModelName(name)) return;

        const metadata = decoratorMetadata(node, 'Injectable');
        if (metadata === null) return;

        const prop = metadataProperty(metadata, 'providedIn');
        if (prop === null) return;
        if (prop.value?.type !== 'Literal' || prop.value.value !== 'root') return;

        context.report({ node: prop, messageId: 'rootProvidedViewModel', data: { name } });
      },
    };
  },
};
