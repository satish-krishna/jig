One-liner: A bordered, softly elevated surface for grouped content — compose it from the sub-parts rather than styling a bare div.

```jsx
<Card>
  <CardHeader>
    <CardTitle>users slice</CardTitle>
    <CardDescription>The one worked vertical slice.</CardDescription>
  </CardHeader>
  <CardContent>End-to-end across every layer.</CardContent>
  <CardFooter>
    <Button size="sm">Open</Button>
  </CardFooter>
</Card>
```

Parts: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Radius is `--radius-xl` (14px); elevation is `--shadow-sm`. Keep cards flat — one shadow level, no nested shadows.
