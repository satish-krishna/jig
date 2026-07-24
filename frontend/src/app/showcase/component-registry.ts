/**
 * The showcase's index: every component vendored into libs/ui, plus the app's
 * own form patterns.
 *
 * Hand-curated on purpose: `category` and `blurb` are editorial judgements that
 * cannot be derived from the source. Everything mechanical — selectors, inputs,
 * outputs — is generated instead (see component-api.generated.ts), so nothing
 * here restates a fact the code already carries.
 *
 * `slug` is both the route segment (/showcase/<slug>) and the key the API
 * generator emits, which is what lets the generator and the page find each
 * other. For a vendored component that key is its libs/ui directory name; for a
 * `Patterns` entry it is a slug the generator is told about explicitly.
 */
export interface ComponentEntry {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly blurb: string;
}

export type Category =
  | 'Actions'
  | 'Forms'
  | 'Data display'
  | 'Navigation'
  | 'Overlays'
  | 'Menus'
  | 'Feedback'
  | 'Layout'
  | 'Patterns';

export const CATEGORY_ORDER: readonly Category[] = [
  'Actions',
  'Forms',
  'Data display',
  'Navigation',
  'Overlays',
  'Menus',
  'Feedback',
  'Layout',
  'Patterns',
];

/**
 * Entries in this category are the app's own compositions, not spartan's, so
 * there is no upstream page to link them to. Discriminating on the category
 * rather than a per-entry flag means the 56 vendored entries stay silent and
 * absence never comes to mean "spartan" by default.
 */
export const PATTERN_CATEGORY: Category = 'Patterns';

export const COMPONENTS: readonly ComponentEntry[] = [
  // Actions
  { slug: 'button', name: 'Button', category: 'Actions', blurb: 'Variants, sizes and icon buttons.' },
  { slug: 'button-group', name: 'Button group', category: 'Actions', blurb: 'Segmented row of related actions.' },
  { slug: 'toggle', name: 'Toggle', category: 'Actions', blurb: 'A button with a pressed state.' },
  { slug: 'toggle-group', name: 'Toggle group', category: 'Actions', blurb: 'Two to seven mutually exclusive options.' },

  // Forms
  { slug: 'field', name: 'Field', category: 'Forms', blurb: 'Label, control, description and error anatomy.' },
  { slug: 'label', name: 'Label', category: 'Forms', blurb: 'Control labelling.' },
  { slug: 'input', name: 'Input', category: 'Forms', blurb: 'Single-line text entry.' },
  { slug: 'textarea', name: 'Textarea', category: 'Forms', blurb: 'Multi-line text entry.' },
  { slug: 'native-select', name: 'Native select', category: 'Forms', blurb: 'The platform select, styled.' },
  { slug: 'select', name: 'Select', category: 'Forms', blurb: 'Overlay-based select with rich items.' },
  { slug: 'combobox', name: 'Combobox', category: 'Forms', blurb: 'Filterable select, single or multiple.' },
  { slug: 'autocomplete', name: 'Autocomplete', category: 'Forms', blurb: 'Free text with suggestions.' },
  { slug: 'checkbox', name: 'Checkbox', category: 'Forms', blurb: 'Binary and indeterminate states.' },
  { slug: 'radio-group', name: 'Radio group', category: 'Forms', blurb: 'One choice from a small set.' },
  { slug: 'switch', name: 'Switch', category: 'Forms', blurb: 'Immediate on/off toggle.' },
  { slug: 'slider', name: 'Slider', category: 'Forms', blurb: 'Single value or range.' },
  { slug: 'input-group', name: 'Input group', category: 'Forms', blurb: 'Input with addons and inline buttons.' },
  { slug: 'input-otp', name: 'Input OTP', category: 'Forms', blurb: 'One-time-code entry.' },
  { slug: 'date-picker', name: 'Date picker', category: 'Forms', blurb: 'Single date, range and multi.' },
  { slug: 'calendar', name: 'Calendar', category: 'Forms', blurb: 'Inline month grid.' },

  // Data display
  { slug: 'table', name: 'Table', category: 'Data display', blurb: 'Semantic table primitives.' },
  { slug: 'card', name: 'Card', category: 'Data display', blurb: 'Header, content, footer and action.' },
  { slug: 'badge', name: 'Badge', category: 'Data display', blurb: 'Short status labels.' },
  { slug: 'avatar', name: 'Avatar', category: 'Data display', blurb: 'Image with fallback, badge and groups.' },
  { slug: 'kbd', name: 'Kbd', category: 'Data display', blurb: 'Keyboard shortcut display.' },
  { slug: 'item', name: 'Item', category: 'Data display', blurb: 'Row with media, content and actions.' },
  { slug: 'empty', name: 'Empty', category: 'Data display', blurb: 'Empty-state block.' },
  { slug: 'typography', name: 'Typography', category: 'Data display', blurb: 'Headings, prose, code and lists.' },
  { slug: 'aspect-ratio', name: 'Aspect ratio', category: 'Data display', blurb: 'Constrain a box to a ratio.' },

  // Navigation
  { slug: 'sidebar', name: 'Sidebar', category: 'Navigation', blurb: 'Full sidebar system with rail and submenus.' },
  { slug: 'navigation-menu', name: 'Navigation menu', category: 'Navigation', blurb: 'Horizontal nav with panels.' },
  { slug: 'breadcrumb', name: 'Breadcrumb', category: 'Navigation', blurb: 'Trail to the current page.' },
  { slug: 'tabs', name: 'Tabs', category: 'Navigation', blurb: 'Switch between panels.' },
  { slug: 'pagination', name: 'Pagination', category: 'Navigation', blurb: 'Page controls, plain or numbered.' },

  // Overlays
  { slug: 'dialog', name: 'Dialog', category: 'Overlays', blurb: 'Modal with header, body and footer.' },
  { slug: 'alert-dialog', name: 'Alert dialog', category: 'Overlays', blurb: 'Confirm or cancel a destructive act.' },
  { slug: 'sheet', name: 'Sheet', category: 'Overlays', blurb: 'Edge-anchored panel.' },
  { slug: 'drawer', name: 'Drawer', category: 'Overlays', blurb: 'Draggable bottom panel.' },
  { slug: 'popover', name: 'Popover', category: 'Overlays', blurb: 'Anchored floating content.' },
  { slug: 'hover-card', name: 'Hover card', category: 'Overlays', blurb: 'Preview on hover.' },
  { slug: 'tooltip', name: 'Tooltip', category: 'Overlays', blurb: 'Short hint on hover or focus.' },

  // Menus
  { slug: 'dropdown-menu', name: 'Dropdown menu', category: 'Menus', blurb: 'Menu from a trigger, with submenus.' },
  { slug: 'context-menu', name: 'Context menu', category: 'Menus', blurb: 'Right-click menu.' },
  { slug: 'menubar', name: 'Menubar', category: 'Menus', blurb: 'Desktop-style menu bar.' },
  { slug: 'command', name: 'Command', category: 'Menus', blurb: 'Command palette with search.' },

  // Feedback
  { slug: 'alert', name: 'Alert', category: 'Feedback', blurb: 'Inline message with title and body.' },
  { slug: 'sonner', name: 'Sonner', category: 'Feedback', blurb: 'Stacked toasts.' },
  { slug: 'progress', name: 'Progress', category: 'Feedback', blurb: 'Determinate progress bar.' },
  { slug: 'skeleton', name: 'Skeleton', category: 'Feedback', blurb: 'Loading placeholder.' },
  { slug: 'spinner', name: 'Spinner', category: 'Feedback', blurb: 'Indeterminate activity.' },

  // Layout
  { slug: 'separator', name: 'Separator', category: 'Layout', blurb: 'Horizontal or vertical rule.' },
  { slug: 'accordion', name: 'Accordion', category: 'Layout', blurb: 'Collapsible sections.' },
  { slug: 'collapsible', name: 'Collapsible', category: 'Layout', blurb: 'One show/hide region.' },
  { slug: 'carousel', name: 'Carousel', category: 'Layout', blurb: 'Horizontal slides with controls.' },
  { slug: 'resizable', name: 'Resizable', category: 'Layout', blurb: 'Draggable split panels.' },
  { slug: 'scroll-area', name: 'Scroll area', category: 'Layout', blurb: 'Styled custom scrollbars.' },

  // Patterns — the app's own, assembled from the controls above
  {
    slug: 'schema-form',
    name: 'Schema form',
    category: 'Patterns',
    blurb: 'Renders any zod schema known only at runtime.',
  },
  {
    slug: 'signal-form',
    name: 'Signal form',
    category: 'Patterns',
    blurb: 'A typed form you author, validated by its zod schema.',
  },
];

/** The route /showcase redirects here. */
export const FIRST_COMPONENT = COMPONENTS[0].slug;

export const DOCS_URL = (slug: string) => `https://www.spartan.ng/components/${slug}`;

export function groupedByCategory(
  filter = '',
): readonly { readonly category: Category; readonly items: readonly ComponentEntry[] }[] {
  const needle = filter.trim().toLowerCase();
  const match = (c: ComponentEntry) =>
    !needle || c.name.toLowerCase().includes(needle) || c.slug.includes(needle);

  return CATEGORY_ORDER.map((category) => ({
    category,
    items: COMPONENTS.filter((c) => c.category === category && match(c)),
  })).filter((g) => g.items.length > 0);
}
