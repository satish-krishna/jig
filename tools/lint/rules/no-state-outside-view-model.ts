import { hasDecorator, tierOf } from '../ast.ts';

// computed is deliberately absent. See docs/architecture/rules/no-state-outside-view-model.md
// for why: it is derived, never owned, state.
const OWNED_STATE = new Set(['signal', 'linkedSignal', 'form']);

/**
 * The name of the class property a `form(...)` call wraps, or null.
 *
 * `this.model` ONLY. A bare `Identifier` was accepted here once and it was a
 * hole, not a convenience: inside a class field initializer a bare name can
 * never resolve to a sibling property, only `this.X` can. So the branch could
 * match nothing legitimate, while a module-scope `const draft = signal(...)`
 * sitting beside a component property of the same name silenced that property's
 * real violation. The rule's own suite passed throughout, which is the tell —
 * a branch no valid input reaches is a branch no test covers.
 */
function backingModelName(arg) {
  if (arg?.type === 'MemberExpression' && arg.object?.type === 'ThisExpression' && arg.property?.type === 'Identifier') {
    return arg.property.name;
  }
  return null;
}

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Container components own state through a ViewModel.',
      url: 'docs/architecture/rules/no-state-outside-view-model.md',
    },
    schema: [],
    messages: {
      stateOutsideVm:
        "'{{name}}()' is screen state declared in a container component. It belongs in a " +
        'component-provided ViewModel, which is unit-testable with zero DOM. ' +
        "Good: @Injectable() class XViewModel { readonly q = signal(''); } and " +
        '@Component({ providers: [XViewModel] }) with vm = inject(XViewModel). ' +
        "Bad: readonly q = signal('') in the component. " +
        'Copy frontend/src/app/features/users/user-list.view-model.ts.',
    },
  },
  create(context) {
    if (tierOf(context.filename) !== 'container') return {};

    return {
      'ClassDeclaration, ClassExpression'(node) {
        if (!hasDecorator(node, 'Component')) return;

        const stateMembers = [];
        for (const member of node.body.body) {
          if (member.type !== 'PropertyDefinition') continue;
          const init = member.value;
          if (init?.type !== 'CallExpression') continue;
          const name = init.callee?.type === 'Identifier' ? init.callee.name : null;
          if (name === null || !OWNED_STATE.has(name)) continue;
          stateMembers.push({ member, name, init });
        }

        // A form() and the signal that backs it are one defect, not two: report
        // the form, and skip the exact property it wraps. This is the same
        // once-per-defect call the sibling no-reactive-form rule makes for a
        // reactive form and its FormGroup — see the doc for the worked example.
        const backing = new Set();
        for (const { name, init } of stateMembers) {
          if (name !== 'form') continue;
          const backedName = backingModelName(init.arguments[0]);
          if (backedName !== null) backing.add(backedName);
        }

        for (const { member, name } of stateMembers) {
          if (name !== 'form') {
            const key = member.key?.type === 'Identifier' ? member.key.name : null;
            if (key !== null && backing.has(key)) continue;
          }
          context.report({ node: member, messageId: 'stateOutsideVm', data: { name } });
        }
      },
    };
  },
};
