import { classOf, hasDecorator } from '../ast.ts';

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A component never subscribes to an Observable itself. Its ViewModel does.',
      url: 'docs/architecture/rules/no-component-subscribe.md',
    },
    schema: [],
    messages: {
      componentSubscribe:
        "'.subscribe(...)' inside a @Component class means the component is talking to an " +
        'Observable directly instead of reading state its ViewModel already resolved. ' +
        'Good: the ViewModel calls this.repo.list().subscribe(...) and exposes the result as a ' +
        'signal; the component reads vm.users(). ' +
        'Bad: this.repo.list().subscribe(...) inside the component. ' +
        'Copy frontend/src/app/features/users/user-list.view-model.ts and ' +
        'frontend/src/app/features/users/user-list.view.ts.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee?.type !== 'MemberExpression') return;
        if (callee.property?.type !== 'Identifier' || callee.property.name !== 'subscribe') return;

        const cls = classOf(node);
        if (cls === null || !hasDecorator(cls, 'Component')) return;

        context.report({ node, messageId: 'componentSubscribe' });
      },
    };
  },
};
