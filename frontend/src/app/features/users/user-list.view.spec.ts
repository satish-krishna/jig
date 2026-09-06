import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { UserListView } from './user-list.view';
import { Transport } from '../../transport';
import type { OperationName, Req, Res } from '../../contracts';
import type { AppError } from '../../transport';

/** A fake wire whose response (or failure) is supplied per test. Mirrors the ViewModel spec. */
class FakeTransport extends Transport {
  constructor(private readonly impl: () => Observable<unknown>) {
    super();
  }
  request<K extends OperationName>(_op: K, _payload: Req<K>): Observable<Res<K>> {
    return this.impl() as Observable<Res<K>>;
  }
}

function render(impl: () => Observable<unknown> = () => of([])) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: Transport, useValue: new FakeTransport(impl) }],
  });
  const fixture = TestBed.createComponent(UserListView);
  fixture.detectChanges();
  return fixture;
}

describe('UserListView', () => {
  it('renders one row per user', () => {
    const users = [
      { id: '1', name: 'Ada', email: 'ada@x.io' },
      { id: '2', name: 'Grace', email: 'grace@x.io' },
    ];
    const list = render(() => of(users)).nativeElement.querySelectorAll('li');

    expect(list.length).toBe(2);
    expect(list[0].textContent).toContain('Ada');
  });

  it('renders the empty state when the list comes back empty', () => {
    const fixture = render(() => of([]));

    expect(fixture.nativeElement.textContent).toContain('No users yet');
  });

  it('surfaces a load failure to the user', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: 'users.list' };
    const fixture = render(() => throwError(() => err));

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('offline');
  });

  it('titles the page with a typography primitive, not a bare heading', () => {
    // The reference view is the file every feature is copied from, and it rendered
    // a bare <h1>. libs/ui ships the typography vocabulary; hlmH3 is the weight the
    // showcase already uses for a page title (text-2xl font-semibold), so the
    // element stays semantic and the appearance comes from the primitive.
    const heading = render().nativeElement.querySelector('h1');

    expect(heading.hasAttribute('hlmH3')).toBe(true);
  });

  it('renders its list through the typography primitive', () => {
    const list = render().nativeElement.querySelector('ul');

    expect(list.hasAttribute('hlmUl')).toBe(true);
  });

  it('reports a failure through the alert primitive', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: 'users.list' };
    const alert = render(() => throwError(() => err)).nativeElement.querySelector('[role="alert"]');

    expect(alert.hasAttribute('hlmAlert')).toBe(true);
  });

  it('carries no class that styles nothing', () => {
    // It shipped class="users", "status", "error", "user-list" and "empty". None of
    // the five matched a rule in styles.css or any component stylesheet, so the view
    // was styled by nothing at all — the same defect user-form.spec.ts records for
    // class="user-form". A decorative class name is not a layout.
    const dead = ['users', 'status', 'error', 'user-list', 'empty'];
    const html = render().nativeElement.innerHTML as string;

    for (const cls of dead) {
      expect(html, `dead class "${cls}" is still rendered`).not.toContain(`class="${cls}"`);
    }
  });
});
