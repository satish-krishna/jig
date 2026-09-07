/**
 * File-scoped, not component-scoped: `provideIcons(...)` may sit in a
 * component's `providers`, in an `ApplicationConfig` (app.config.ts), or in a
 * test's TestBed setup. If the call exists anywhere in the file, every named
 * glyph import in that file counts as registered.
 */
export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'An imported glyph must be registered.',
      url: 'docs/architecture/rules/no-unregistered-icon.md',
    },
    schema: [],
    messages: {
      unregisteredIcon:
        'This file imports glyphs from @ng-icons/lucide and never calls provideIcons, so ' +
        '<ng-icon> renders nothing at runtime and no build error says so. ' +
        "Good: providers: [provideIcons({ lucideUsers })]  Bad: import { lucideUsers } with no provideIcons",
    },
  },
  create(context) {
    let firstImport = null;
    let registered = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@ng-icons/lucide' || firstImport !== null) return;
        // Type-only imports and bare side-effect imports are not glyphs.
        if (node.importKind === 'type') return;

        const named = node.specifiers.some(
          (s) => s.type === 'ImportSpecifier' && s.importKind !== 'type',
        );
        if (named) firstImport = node;
      },
      'CallExpression[callee.name="provideIcons"]'() {
        registered = true;
      },
      'Program:exit'() {
        if (firstImport !== null && !registered) {
          context.report({ node: firstImport, messageId: 'unregisteredIcon' });
        }
      },
    };
  },
};
