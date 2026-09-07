import { classOf, decoratorMetadata, metadataProperty } from '../ast.ts';

const isViewModelName = (name) => typeof name === 'string' && name.endsWith('ViewModel');

/** True when the @Component metadata's `providers` array lists the named identifier. */
function isProvided(metadata, name) {
  const prop = metadataProperty(metadata, 'providers');
  if (prop?.value?.type !== 'ArrayExpression') return false;
  return prop.value.elements.some((e) => e?.type === 'Identifier' && e.name === name);
}

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A component that injects a ViewModel must provide it itself.',
      url: 'docs/architecture/rules/no-unprovided-view-model.md',
    },
    schema: [],
    messages: {
      unprovidedViewModel:
        "inject({{name}}) is called here, but this component's @Component metadata does not list " +
        "'{{name}}' in providers. Without it, Angular resolves the injection against whatever " +
        'ancestor provided one (or throws if none did), which is not the component-scoped instance ' +
        'the ViewModel pattern depends on. ' +
        'Good: @Component({ providers: [{{name}}] }) class X { vm = inject({{name}}); }  ' +
        'Bad: @Component({}) class X { vm = inject({{name}}); }. ' +
        'Copy frontend/src/app/features/users/user-list.view.ts.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee?.type !== 'Identifier' || node.callee.name !== 'inject') return;

        const arg = node.arguments?.[0];
        if (arg?.type !== 'Identifier' || !isViewModelName(arg.name)) return;

        const cls = classOf(node);
        if (cls === null) return;

        const metadata = decoratorMetadata(cls, 'Component');
        if (metadata === null) return;

        if (isProvided(metadata, arg.name)) return;

        context.report({ node, messageId: 'unprovidedViewModel', data: { name: arg.name } });
      },
    };
  },
};
