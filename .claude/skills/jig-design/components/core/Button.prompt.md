One-liner: The primary action control (Spartan `hlmBtn`) — use for any clickable command; pick `variant` by emphasis and an `icon*` size for square icon-only buttons.

```jsx
<Button variant="default">Save changes</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon" aria-label="Settings">{/* icon */}</Button>
<Button variant="destructive">Delete</Button>
```

Variants: `default` (solid primary), `outline`, `secondary`, `ghost`, `destructive` (tinted, not solid red), `link`.
Sizes: `default` (h-8), `xs`, `sm`, `lg`, and square `icon` / `icon-xs` / `icon-sm` / `icon-lg`.
Notes: active state nudges down 1px; disabled drops to 50% opacity. Pass an inline SVG (e.g. Lucide) as a child for leading/trailing icons.
