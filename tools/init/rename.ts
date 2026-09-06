// Pure name transforms for the template init. The single template token "jig"
// maps to different forms by context (kebab for npm/Angular, snake for the Rust
// lib, no-hyphen for the bundle id), so replacement is ordered and case-aware,
// not a blind find-replace. Kept pure so it is unit-tested without touching disk.

export interface Names {
  /** PascalCase — .NET namespaces/projects, Tauri productName. e.g. AcmePortal */
  pascal: string;
  /** kebab-case — npm/Angular project, dist path, Cargo package. e.g. acme-portal */
  kebab: string;
  /** snake_case — Rust lib identifier. e.g. acme_portal */
  snake: string;
  /** lowercase, no separators — bundle id segment. e.g. acmeportal */
  lower: string;
  /** reverse-DNS bundle identifier. e.g. com.acmeportal.app */
  bundleId: string;
}

/** Split a name given in Pascal/camel/kebab/snake/spaced form into its words. */
function words(raw: string): string[] {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean);
}

export function deriveNames(rawName: string, bundleId?: string): Names {
  if (rawName.includes('.')) {
    throw new Error(
      `App name must not contain a dot: "${rawName}". Namespaces are <Product>.<Layer>, ` +
        'and a dotted product name silently disables the architecture analyzer.',
    );
  }
  const parts = words(rawName);
  if (parts.length === 0) throw new Error('App name must contain at least one word.');
  const lowerParts = parts.map((w) => w.toLowerCase());
  const pascal = parts.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
  const lower = lowerParts.join('');
  return {
    pascal,
    kebab: lowerParts.join('-'),
    snake: lowerParts.join('_'),
    lower,
    bundleId: bundleId ?? `com.${lower}.app`,
  };
}

/**
 * Rewrite file CONTENT. Order matters: the specific lowercase forms that contain
 * "jig" (the bundle id, the `jig_lib` Rust identifier, and the ESLint plugin's
 * import binding / registration key) are replaced before the generic `jig` ->
 * kebab pass, so they are not mangled. `Jig` and `jig` are case-sensitive and
 * independent.
 *
 * The ESLint plugin name is a special case: `'jig/no-literal-spacing'` is a
 * quoted string, so it rewrites fine to kebab-case, but `import jig from
 * '../tools/lint/index.mjs'` and the `plugins: { jig }` shorthand bind and
 * reference a JS identifier, not a string. Kebab-case is not a valid
 * identifier, so a blind kebab pass would leave `import acme-portal from ...`
 * and `plugins: { acme-portal }` — both syntax errors. These two forms are
 * rewritten to a camelCase identifier instead, and the shorthand is expanded to
 * an explicit `'kebab-key': camelValue` pair so the registered key still
 * matches the kebab-case prefix the generic pass gives the rule string.
 */
export function renameContent(text: string, n: Names): string {
  const camel = n.pascal.charAt(0).toLowerCase() + n.pascal.slice(1);
  return text
    .split('com.jig.app').join(n.bundleId)
    .split('jig_lib').join(`${n.snake}_lib`)
    .split('import jig from').join(`import ${camel} from`)
    .split('plugins: { jig }').join(`plugins: { '${n.kebab}': ${camel} }`)
    .split('Jig').join(n.pascal)
    .split('jig').join(n.kebab);
}

/**
 * Rewrite a repo PATH. `Jig` (PascalCase) appears in .NET project paths; the
 * lowercase `jig` appears in the design-system skill folder (`.claude/skills/
 * jig-design`). Replace Pascal before lowercase, same order as renameContent.
 */
export function renamePath(path: string, n: Names): string {
  return path.split('Jig').join(n.pascal).split('jig').join(n.kebab);
}

/** Remove template-only prose wrapped in `<!-- template:start -->` / `<!-- template:end -->`. */
export function stripTemplateBlocks(text: string): string {
  return text.replace(/[ \t]*<!--\s*template:start\s*-->[\s\S]*?<!--\s*template:end\s*-->[ \t]*\r?\n?/g, '');
}
