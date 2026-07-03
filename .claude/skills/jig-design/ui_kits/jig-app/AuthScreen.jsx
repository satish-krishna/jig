/* Centered auth screen — demonstrates the jig "full page, centered
   content" layout using Card + Field + Input + Button. */
function AuthScreen({ onSignIn }) {
  const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
    Field, FieldDescription, Label, Input, Button, Separator } = window.JigDesignSystem_ac97f9;
  const [email, setEmail] = React.useState('satish@jig.dev');

  return (
    <div className="hlm-centered">
      <div className="hlm-centered__inner" style={{ maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 'var(--radius-lg)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>J</span>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>jig</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your workspace</CardTitle>
            <CardDescription>One frontend, two wires. Pick up where you left off.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); onSignIn(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field>
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Field>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Label htmlFor="a-pass">Password</Label>
                  <Button variant="link" size="sm" type="button" style={{ height: 'auto' }}>Forgot?</Button>
                </div>
                <Input id="a-pass" type="password" defaultValue="hunter2hunter2" />
              </Field>
              <Button type="submit" style={{ width: '100%' }}>Sign in</Button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
              <Separator style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>or</span>
              <Separator style={{ flex: 1 }} />
            </div>
            <Button variant="outline" style={{ width: '100%' }} onClick={onSignIn}>
              {React.createElement(window.Icons.gitBranch)} Continue with GitHub
            </Button>
          </CardContent>
          <CardFooter style={{ justifyContent: 'center' }}>
            <FieldDescription>No account? <a href="#" style={{ color: 'var(--foreground)', fontWeight: 500 }}>Request access</a></FieldDescription>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
window.AuthScreen = AuthScreen;
