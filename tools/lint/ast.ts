/**
 * Predicates shared by the rules. Each rule stays a handful of lines because the
 * AST shapes it asks about live here, stated once.
 */

/** The `@Component({...})` metadata object literal, or null. */
export function decoratorMetadata(classNode, decoratorName = 'Component') {
  const decorators = classNode.decorators ?? [];
  for (const d of decorators) {
    const call = d.expression;
    if (call?.type !== 'CallExpression') continue;
    if (call.callee?.name !== decoratorName) continue;
    const arg = call.arguments?.[0];
    if (arg?.type === 'ObjectExpression') return arg;
  }
  return null;
}

/** True when the class carries the named decorator. */
export const hasDecorator = (classNode, name) => decoratorMetadata(classNode, name) !== null;

/** A property of a decorator metadata object, by key name, or null. */
export function metadataProperty(metadata, key) {
  for (const prop of metadata.properties ?? []) {
    if (prop.type !== 'Property') continue;
    const name = prop.key?.type === 'Identifier' ? prop.key.name : prop.key?.value;
    if (name === key) return prop;
  }
  return null;
}

/** True when the @Component metadata lists the named identifier in `imports`. */
export function componentImports(metadata, name) {
  const prop = metadataProperty(metadata, 'imports');
  if (prop?.value?.type !== 'ArrayExpression') return false;
  return prop.value.elements.some((e) => importedName(e) === name);
}

/**
 * The name an `imports:` array entry brings in, or null.
 *
 * Two shapes count, because an NgModule is entered both ways. A bare
 * `NgIconsModule` is an Identifier; a configured one is `NgIconsModule.withIcons({...})`,
 * a CallExpression over a MemberExpression, and that is the form anybody actually
 * writes — `withIcons`, `forRoot`, `withConfig`. Matching only the Identifier meant
 * the three banned-module rules each missed the shape most likely to reintroduce the
 * thing they ban. Found by review on no-legacy-icon-module and fixed here rather than
 * in that one rule, because all three share this helper and so shared the blind spot.
 *
 * A spread (`...ICONS`) still returns null: what it holds is not decidable from the
 * decorator, and the rules' documents record it as a known blind spot.
 */
function importedName(element) {
  if (element?.type === 'Identifier') return element.name;
  if (element?.type === 'CallExpression' && element.callee?.type === 'MemberExpression') {
    return element.callee.object?.type === 'Identifier' ? element.callee.object.name : null;
  }
  return null;
}

/** The nearest enclosing class declaration or expression, or null. */
export function classOf(node) {
  for (let n = node; n != null; n = n.parent) {
    if (n.type === 'ClassDeclaration' || n.type === 'ClassExpression') return n;
  }
  return null;
}

/**
 * The tier a file belongs to. Path-based on purpose: a marker or a naming
 * convention is something an agent can add to escape a rule, and a path is not.
 * Presentational is the default, so a new folder never silently acquires
 * container rules.
 */
export function tierOf(filename) {
  const path = filename.replace(/\\/g, '/');
  if (/\/app\/(features|shell)\//.test(path)) return 'container';
  return 'presentational';
}

/** Every module specifier the file imports the given local name from. */
export function importedFrom(context, localName) {
  const source = context.sourceCode ?? context.getSourceCode();
  for (const node of source.ast.body) {
    if (node.type !== 'ImportDeclaration') continue;
    for (const spec of node.specifiers) {
      if (spec.local?.name === localName) return node.source.value;
    }
  }
  return null;
}

/** The static class list on a template element, or an empty array. */
export function classAttribute(node) {
  for (const attr of node.attributes ?? []) {
    if (attr.name === 'class' && typeof attr.value === 'string') {
      return attr.value.split(/\s+/).filter(Boolean);
    }
  }
  return [];
}

/** Strips responsive and state prefixes: `dark:sm:bg-red-500` -> `bg-red-500`. */
export const baseUtility = (cls) => cls.slice(cls.lastIndexOf(':') + 1);
