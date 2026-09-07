import { hasDecorator } from '../ast.ts';

/**
 * A path rule, not a *Service suffix heuristic. jig's data access lives under
 * repositories/ and transport/, so this is exact in both directions: MenuService
 * and ThemeService are UI registries and pass, while inject(WIRE) from
 * ../transport is caught, which a suffix rule would miss entirely.
 *
 * This rule absorbs what would otherwise be a second, inverted
 * no-presentational-inject rule: without a src/app/ui/ split there are no two
 * populations to check against each other, only one predicate — does this
 * component import a data path — applied to every @Component file.
 */
const DATA_PATHS = /\/(repositories|transport)(\/|$)/;

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'A component reaches data through its ViewModel, never a repository or transport directly.',
      url: 'docs/architecture/rules/no-feature-inject-data.md',
    },
    schema: [],
    messages: {
      featureInjectsData:
        "This component's file imports from '{{source}}'. A component reaches data through its " +
        'ViewModel, so the view never knows a transport or a repository exists. ' +
        'Good: @Injectable() class XViewModel { private readonly repo = inject(UserRepository); }  ' +
        'Bad: inject(UserRepository) in the component. ' +
        'Copy frontend/src/app/features/users/user-list.view-model.ts.',
    },
  },
  create(context) {
    const candidates = [];
    let hasComponent = false;

    return {
      'ClassDeclaration, ClassExpression'(node) {
        if (hasDecorator(node, 'Component')) hasComponent = true;
      },
      ImportDeclaration(node) {
        if (typeof node.source.value === 'string' && DATA_PATHS.test(node.source.value)) {
          candidates.push(node);
        }
      },
      'Program:exit'() {
        // A file with no @Component is not a view. A ViewModel importing its
        // repository is the shape the pattern requires, so it is out of scope,
        // not a defect the file merely happened not to trigger.
        if (!hasComponent) return;

        for (const node of candidates) {
          context.report({ node, messageId: 'featureInjectsData', data: { source: node.source.value } });
        }
      },
    };
  },
};
