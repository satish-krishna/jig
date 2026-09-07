import { classAttribute } from '../ast.ts';

const has = (node, cls) => classAttribute(node).includes(cls);
const isRow = (node) => has(node, 'flex') && !has(node, 'flex-col');
const isColumn = (node) => has(node, 'flex') && has(node, 'flex-col');

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Two-dimensional arrangement is a grid.',
      url: 'docs/architecture/rules/no-nested-flex-grid.md',
    },
    schema: [],
    messages: {
      nestedFlexGrid:
        'A flex row of flex columns is a grid you have not written yet. Nested flex hides ' +
        'the layout across three files; a grid states it in one line you can read. ' +
        'Good: <div class="grid grid-cols-2 gap-m">  Bad: <div class="flex"><div class="flex flex-col">',
    },
  },
  create(context) {
    return {
      Element(node) {
        if (!isRow(node)) return;

        const columnChildren = (node.children ?? []).filter((c) => c.type === 'Element' && isColumn(c));
        if (columnChildren.length >= 2) context.report({ node, messageId: 'nestedFlexGrid' });
      },
    };
  },
};
