/**
 * The showcase's index of every component vendored into libs/ui.
 *
 * Hand-curated on purpose: `category` and `blurb` are editorial judgements that
 * cannot be derived from the source. Everything mechanical — selectors, inputs,
 * outputs — is generated instead (see component-api.generated.ts), so nothing
 * here restates a fact the code already carries.
 *
 * `slug` is both the route segment (/showcase/<slug>) and the libs/ui directory
 * name, which is what lets the API generator and the page find each other.
 */
export interface ComponentEntry {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly blurb: string;
  /** Whether a hand-written page with verified usages exists yet. */
  readonly documented?: boolean;
}

export type Category =
  | 'Actions'
  | 'Forms'
  | 'Data display'
  | 'Navigation'
  | 'Overlays'
  | 'Menus'
  | 'Feedback'
  | 'Layout';

export const CATEGORY_ORDER: readonly Category[] = [
  'Actions',
  'Forms',
  'Data display',
  'Navigation',
  'Overlays',
  'Menus',
  'Feedback',
  'Layout',
];

export const COMPONENTS: readonly ComponentEntry[] = [
  // Actions
  { slug: 'button', name: 'Button', category: 'Actions', blurb: 'Variants, sizes and icon buttons.', documented: true },
  { slug: 'button-group', name: 'Button group', category: 'Actions', blurb: 'Segmented row of related actions.', documented: true },
  { slug: 'toggle', name: 'Toggle', category: 'Actions', blurb: 'A button with a pressed state.', documented: true },
  { slug: 'toggle-group', name: 'Toggle group', category: 'Actions', blurb: 'Two to seven mutually exclusive options.', documented: true },

  // Forms
  { slug: 'field', name: 'Field', category: 'Forms', blurb: 'Label, control, description and error anatomy.' },
  { slug: 'label', name: 'Label', category: 'Forms', blurb: 'Control labelling.' },
  { slug: 'input', name: 'Input', category: 'Forms', blurb: 'Single-line text entry.' },
  { slug: 'textarea', name: 'Textarea', category: 'Forms', blurb: 'Multi-line text entry.' },
  { slug: 'native-select', name: 'Native select', category: 'Forms', blurb: 'The platform select, styled.' },
  { slug: 'select', name: 'Select', category: 'Forms', blurb: 'Overlay-based select with rich items.' },
  { slug: 'combobox', name: 'Combobox', category: 'Forms', blurb: 'Filterable select, single or multiple.' },
  { slug: 'autocomplete', name: 'Autocomplete', category: 'Forms', blurb: 'Free text with suggestions.' },
  { slug: 'checkbox', name: 'Checkbox', category: 'Forms', blurb: 'Binary and indeterminate states.', documented: true },
  { slug: 'radio-group', name: 'Radio group', category: 'Forms', blurb: 'One choice from a small set.' },
  { slug: 'switch', name: 'Switch', category: 'Forms', blurb: 'Immediate on/off toggle.' },
  { slug: 'slider', name: 'Slider', category: 'Forms', blurb: 'Single value or range.' },
  { slug: 'input-group', name: 'Input group', category: 'Forms', blurb: 'Input with addons and inline buttons.' },
  { slug: 'input-otp', name: 'Input OTP', category: 'Forms', blurb: 'One-time-code entry.' },
  { slug: 'date-picker', name: 'Date picker', category: 'Forms', blurb: 'Single date, range and multi.' },
  { slug: 'calendar', name: 'Calendar', category: 'Forms', blurb: 'Inline month grid.' },

  // Data display
  { slug: 'table', name: 'Table', category: 'Data display', blurb: 'Semantic table primitives.', documented: true },
  { slug: 'card', name: 'Card', category: 'Data display', blurb: 'Header, content, footer and action.', documented: true },
  { slug: 'badge', name: 'Badge', category: 'Data display', blurb: 'Short status labels.', documented: true },
  { slug: 'avatar', name: 'Avatar', category: 'Data display', blurb: 'Image with fallback, badge and groups.', documented: true },
  { slug: 'kbd', name: 'Kbd', category: 'Data display', blurb: 'Keyboard shortcut display.', documented: true },
  { slug: 'item', name: 'Item', category: 'Data display', blurb: 'Row with media, content and actions.', documented: true },
  { slug: 'empty', name: 'Empty', category: 'Data display', blurb: 'Empty-state block.', documented: true },
  { slug: 'typography', name: 'Typography', category: 'Data display', blurb: 'Headings, prose, code and lists.', documented: true },
  { slug: 'aspect-ratio', name: 'Aspect ratio', category: 'Data display', blurb: 'Constrain a box to a ratio.', documented: true },

  // Navigation
  { slug: 'sidebar', name: 'Sidebar', category: 'Navigation', blurb: 'Full sidebar system with rail and submenus.', documented: true },
  { slug: 'navigation-menu', name: 'Navigation menu', category: 'Navigation', blurb: 'Horizontal nav with panels.', documented: true },
  { slug: 'breadcrumb', name: 'Breadcrumb', category: 'Navigation', blurb: 'Trail to the current page.', documented: true },
  { slug: 'tabs', name: 'Tabs', category: 'Navigation', blurb: 'Switch between panels.', documented: true },
  { slug: 'pagination', name: 'Pagination', category: 'Navigation', blurb: 'Page controls, plain or numbered.', documented: true },

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
  { slug: 'alert', name: 'Alert', category: 'Feedback', blurb: 'Inline message with title and body.', documented: true },
  { slug: 'sonner', name: 'Sonner', category: 'Feedback', blurb: 'Stacked toasts.', documented: true },
  { slug: 'progress', name: 'Progress', category: 'Feedback', blurb: 'Determinate progress bar.', documented: true },
  { slug: 'skeleton', name: 'Skeleton', category: 'Feedback', blurb: 'Loading placeholder.', documented: true },
  { slug: 'spinner', name: 'Spinner', category: 'Feedback', blurb: 'Indeterminate activity.', documented: true },

  // Layout
  { slug: 'separator', name: 'Separator', category: 'Layout', blurb: 'Horizontal or vertical rule.', documented: true },
  { slug: 'accordion', name: 'Accordion', category: 'Layout', blurb: 'Collapsible sections.', documented: true },
  { slug: 'collapsible', name: 'Collapsible', category: 'Layout', blurb: 'One show/hide region.', documented: true },
  { slug: 'carousel', name: 'Carousel', category: 'Layout', blurb: 'Horizontal slides with controls.', documented: true },
  { slug: 'resizable', name: 'Resizable', category: 'Layout', blurb: 'Draggable split panels.', documented: true },
  { slug: 'scroll-area', name: 'Scroll area', category: 'Layout', blurb: 'Styled custom scrollbars.', documented: true },
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
