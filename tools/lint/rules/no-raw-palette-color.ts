import { classAttribute, baseUtility } from '../ast.ts';

const PREFIXES = [
  'bg', 'text', 'border', 'ring', 'fill', 'stroke', 'from', 'via', 'to',
  'divide', 'outline', 'decoration', 'placeholder', 'caret', 'accent',
];
const PALETTE = new RegExp(
  `^(${PREFIXES.join('|')})-(` +
    '[a-z]+-\\d{2,3}' + // blue-500, gray-700
    '|\\[#[0-9a-fA-F]{3,8}\\]' + // [#0af]
    '|white|black' +
    ')$',
);

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Colors come from semantic tokens.',
      url: 'docs/architecture/rules/no-raw-palette-color.md',
    },
    schema: [],
    messages: {
      rawPaletteColor:
        "'{{cls}}' is a raw palette color. The palette is pure neutral with one chromatic " +
        'token; use a semantic token so dark mode and theming keep working. ' +
        'Good: class="bg-card text-muted-foreground"  Bad: class="bg-white text-gray-700"',
    },
  },
  create(context) {
    return {
      Element(node) {
        for (const cls of classAttribute(node)) {
          if (PALETTE.test(baseUtility(cls))) {
            context.report({ node, messageId: 'rawPaletteColor', data: { cls } });
          }
        }
      },
    };
  },
};
