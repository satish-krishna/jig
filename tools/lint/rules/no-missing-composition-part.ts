const REQUIRED = {
  'hlm-dialog-content': 'hlmDialogTitle',
  'hlm-sheet-content': 'hlmSheetTitle',
  'hlm-alert-dialog-content': 'hlmAlertDialogTitle',
};

/** An AST node is any object with a string `type`; spans and locs are plain data and lack one. */
const isNode = (value) => value !== null && typeof value === 'object' && typeof value.type === 'string';

// Keys that hold position bookkeeping rather than template structure. Walking
// into them would not be wrong (they carry no `type`, so isNode already
// excludes them) but skipping them up front keeps the walk on template nodes.
const SKIP_KEYS = new Set(['parent', 'sourceSpan', 'startSourceSpan', 'endSourceSpan', 'nameSpan']);

/**
 * Depth-first over every descendant reachable from ANY property of the node,
 * not just `children`. A container's title is not always a direct child: an
 * `@if` nests its content behind `branches[].children`, `@switch` behind
 * `cases[].children`, `@for` behind `children`/`empty`, `@defer` behind
 * `children`/`placeholder`/`loading`/`error`. Naming each of those keys by
 * hand would need updating for every new control-flow form; walking every
 * property once covers all of them, present and future, the same way.
 */
function hasDescendantAttribute(node, name) {
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;

    const value = node[key];
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (!isNode(item)) continue;
      if ((item.attributes ?? []).some((a) => a.name === name)) return true;
      if (hasDescendantAttribute(item, name)) return true;
    }
  }
  return false;
}

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'An overlay container needs its required part.',
      url: 'docs/architecture/rules/no-missing-composition-part.md',
    },
    schema: [],
    messages: {
      missingCompositionPart:
        '<{{container}}> requires a descendant carrying {{part}}, for an accessible name. ' +
        'Good: <{{container}}><h2 {{part}}>Title</h2>...</{{container}}>  ' +
        'Bad: <{{container}}><p>body only</p></{{container}}>',
    },
  },
  create(context) {
    return {
      Element(node) {
        const part = REQUIRED[node.name];
        if (part === undefined) return;
        if (hasDescendantAttribute(node, part)) return;

        context.report({ node, messageId: 'missingCompositionPart', data: { container: node.name, part } });
      },
    };
  },
};
