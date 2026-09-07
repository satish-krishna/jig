import { classAttribute } from '../ast.ts';
import { attributeSelectors, elementSelectors, appearanceFamiliesOf, appearanceFamilyOf } from '../vocabulary.ts';

/**
 * Documented exceptions: a `primitive:family` pair where overriding the
 * primitive's own class is not a fight, it is the ONLY API spartan exposes for
 * that concern, so forbidding the override would forbid the only way to use
 * the primitive. See "Known exceptions" in the doc before adding a second
 * entry — a growing list here is how a gate like this rots.
 *
 * hlm-spinner has no size input. It sizes its icon entirely through its own
 * `text-[length:--spacing(4)]`, and spartan's own Sizes example overrides that
 * exact class (`text-xs`, `text-base`, `text-2xl`, ...) to resize it. The
 * appearance-family deriver in vocabulary.ts does not detect this on its own
 * — `text-[length:...]` embeds a colon inside its own brackets, which defeats
 * baseUtility's prefix stripping, so hlm-spinner derives as setting no
 * families at all. That gap happens to agree with the exception below, but
 * this entry exists to make the exemption a deliberate, written decision
 * rather than an accident of how the deriver currently parses one arbitrary
 * value syntax.
 */
const EXCEPTIONS = new Set(['hlm-spinner:typography']);

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: "Do not override a primitive's appearance at the call site.",
      url: 'docs/architecture/rules/no-appearance-on-primitive.md',
    },
    schema: [],
    messages: {
      appearanceOnPrimitive:
        "'{{cls}}' overrides the appearance of a primitive at the call site. " +
        'Layout, dimensions, margin and position are fine here; color, typography, ' +
        'decoration and internal padding belong in libs/ui or in a token. ' +
        'Good: <button hlmBtn class="w-full">  Bad: <button hlmBtn class="bg-muted">',
    },
  },
  create(context) {
    const attrs = attributeSelectors();
    const els = elementSelectors();

    return {
      Element(node) {
        const primitiveNames = [];
        if (els.has(node.name)) primitiveNames.push(node.name);
        for (const a of node.attributes ?? []) {
          if (attrs.has(a.name)) primitiveNames.push(a.name);
        }
        if (primitiveNames.length === 0) return;

        for (const cls of classAttribute(node)) {
          const family = appearanceFamilyOf(cls);
          if (family === null) continue;

          // A call-site class overrides a primitive only when THAT primitive's
          // own classes() call actually sets the same family — not merely the
          // same exact class. hlm-command sets decoration via `rounded-xl`;
          // a call-site `border` still fights it, even though `border` itself
          // is not the exact class hlm-command writes. hlm-resizable-group
          // sets no decoration at all, so a call-site `border` there is pure
          // addition, not a fight, and is exempt.
          const overridden = primitiveNames.some(
            (name) => appearanceFamiliesOf(name).has(family) && !EXCEPTIONS.has(`${name}:${family}`),
          );
          if (overridden) {
            context.report({ node, messageId: 'appearanceOnPrimitive', data: { cls } });
          }
        }
      },
    };
  },
};
