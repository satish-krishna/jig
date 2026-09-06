// The CSS half of the design gate: a color, a radius, or a spacing value must be
// a token reference, not a literal. The template half is the no-literal-spacing
// ESLint rule.
//
// libs/ui needs no ignore entry: it contains zero .css files and zero inline
// styles, because all its styling is Tailwind classes inlined in TypeScript.
export default {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      // /^(color|.*-color)$/ rather than /color/, so this matches color,
      // background-color and border-color but NOT color-scheme, which is not a
      // color property and whose only legal values are keywords.
      [
        '/^(color|.*-color)$/',
        'background',
        'border-radius',
        '/^padding/',
        '/^margin/',
        'gap',
        'column-gap',
        'row-gap',
      ],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'inherit',
          'initial',
          'unset',
          'none',
          'auto',
          '0',
          // A 1px hairline is a primitive of the design language, not a spacing
          // step. design.md: "1px hairlines everywhere". There is no token for
          // it and inventing one would contradict the scale.
          '1px',
        ],
        disableFix: true,
      },
    ],
  },
};
