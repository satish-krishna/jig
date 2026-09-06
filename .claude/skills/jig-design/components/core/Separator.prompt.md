One-liner: A 1px divider between sections or inline items; set `orientation="vertical"` inside a flex row (give the row a height).

```jsx
<Separator />
<div style={{ display: 'flex', height: 20 }}>
  <span>Docs</span>
  <Separator orientation="vertical" style={{ marginInline: 'var(--spacing-m)' }} />
  <span>API</span>
</div>
```
