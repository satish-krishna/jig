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
 * "jig" (the bundle id and the `jig_lib` Rust identifier) are replaced before the
 * generic `jig` -> kebab pass, so they are not mangled. `Jig` and `jig` are
 * case-sensitive and independent.
 */
export function renameContent(text: string, n: Names): string {
  return text
    .split('com.jig.app').join(n.bundleId)
    .split('jig_lib').join(`${n.snake}_lib`)
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
