// Angular test emitters for the vertical-slice generator. Five pure functions, one per
// Vitest spec file, reproducing the shape of the users reference slice's tests
// (frontend/src/app/operations/user.operations.spec.ts and the four specs under
// frontend/src/app/features/users) with the spec's own names substituted in. No disk
// access here — the CLI (a later task) decides where these EmittedFile entries land.
//
// There is no {kebab}-form.view-model.spec.ts: emit-frontend.ts emits no form ViewModel
// for the same reason — the form renders entirely through SchemaForm, and SchemaForm's
// own behavior is already covered by frontend/src/app/forms/schema-form.spec.ts. The
// emitted form spec below tests only the emitted component's own behavior: that it
// renders the schema form and narrows SchemaForm's untyped payload before re-emitting it.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { label } from './naming.ts';
import { tsString } from './literal.ts';

/**
 * A TS-literal sample value for a field, distinct per variant (0 or 1). Mirrors
 * emit-dotnet-tests.ts's sample() but produces JS literals ('a', 1, true) for a spec
 * file's object literals instead of C# ones.
 */
function sampleValue(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return String(variant + 1);
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? `'a@x.io'` : `'b@x.io'`;
  return variant === 0 ? `'a'` : `'b'`;
}

/** `name: value, name: value` fragment for every field at one sample variant. */
function fieldsLiteral(spec: SliceSpec, variant: 0 | 1): string {
  return spec.fields.map((f) => `${f.name}: ${sampleValue(f, variant)}`).join(', ');
}

/** A sample row object literal carrying an id plus every field, e.g. `{ id: '1', reference: 'a', total: 1 }`. */
function rowLiteral(spec: SliceSpec, id: string, variant: 0 | 1): string {
  return `{ id: '${id}', ${fieldsLiteral(spec, variant)} }`;
}

// ---------------------------------------------------------------------------
// frontend/src/app/operations/{kebab}.operations.spec.ts
// shape source: user.operations.spec.ts
// ---------------------------------------------------------------------------

function emitOperationsSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/operations/${n.kebab}.operations.spec.ts`,
    text: `import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, firstValueFrom } from 'rxjs';
import { ${n.pascal}Operations } from './${n.kebab}.operations';
import { Transport } from '../transport';
import type { OperationName, Req, Res } from '../contracts';

/** Records which operations the facade asks the transport for. */
class RecordingTransport extends Transport {
  readonly calls: Array<{ op: string; payload: unknown }> = [];
  request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>> {
    this.calls.push({ op, payload });
    return of(undefined as unknown as Res<K>);
  }
}

function setup() {
  const transport = new RecordingTransport();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: Transport, useValue: transport }] });
  return { transport, ops: TestBed.inject(${n.pascal}Operations) };
}

describe('${n.pascal}Operations', () => {
  it('list() asks for the ${n.opPrefix}.list operation', async () => {
    const { transport, ops } = setup();
    await firstValueFrom(ops.list());
    expect(transport.calls).toEqual([{ op: '${n.opPrefix}.list', payload: {} }]);
  });

  it('get() asks for ${n.opPrefix}.get with the id', async () => {
    const { transport, ops } = setup();
    await firstValueFrom(ops.get('abc'));
    expect(transport.calls).toEqual([{ op: '${n.opPrefix}.get', payload: { id: 'abc' } }]);
  });

  it('save() asks for ${n.opPrefix}.save with the ${n.camel} body', async () => {
    const { transport, ops } = setup();
    await firstValueFrom(ops.save({ ${fieldsLiteral(spec, 0)} }));
    expect(transport.calls).toEqual([{ op: '${n.opPrefix}.save', payload: { ${fieldsLiteral(spec, 0)} } }]);
  });
});
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view-model.spec.ts
// shape source: user-list.view-model.spec.ts
// ---------------------------------------------------------------------------

function emitListViewModelSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view-model.spec.ts`,
    text: `import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { ${n.pascal}ListViewModel } from './${n.kebab}-list.view-model';
import { Transport } from '../../transport';
import type { OperationName, Req, Res } from '../../contracts';
import type { AppError } from '../../transport';

/** A fake wire whose response (or failure) is supplied per test. */
class FakeTransport extends Transport {
  constructor(private readonly impl: () => Observable<unknown>) {
    super();
  }
  request<K extends OperationName>(_op: K, _payload: Req<K>): Observable<Res<K>> {
    return this.impl() as Observable<Res<K>>;
  }
}

function setup(impl: () => Observable<unknown>): ${n.pascal}ListViewModel {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [${n.pascal}ListViewModel, { provide: Transport, useValue: new FakeTransport(impl) }],
  });
  return TestBed.inject(${n.pascal}ListViewModel);
}

describe('${n.pascal}ListViewModel', () => {
  it('load() populates the ${n.camelPlural} signal and clears loading', () => {
    const ${n.camelPlural} = [${rowLiteral(spec, '1', 0)}];
    const vm = setup(() => of(${n.camelPlural}));

    vm.load();

    expect(vm.${n.camelPlural}()).toEqual(${n.camelPlural});
    expect(vm.loading()).toBe(false);
    expect(vm.error()).toBeNull();
  });

  it('load() puts a failure on the error signal and clears loading', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: '${n.opPrefix}.list' };
    const vm = setup(() => throwError(() => err));

    vm.load();

    expect(vm.error()).toEqual(err);
    expect(vm.loading()).toBe(false);
  });

  it('save() reloads the list on success', () => {
    const ${n.camelPlural} = [${rowLiteral(spec, '1', 0)}];
    const vm = setup(() => of(${n.camelPlural}));

    vm.save({ ${fieldsLiteral(spec, 0)} });

    expect(vm.${n.camelPlural}()).toEqual(${n.camelPlural});
  });
});
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view.spec.ts
// shape source: user-list.view.spec.ts
// ---------------------------------------------------------------------------

function emitListViewSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  const firstField = spec.fields[0];
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view.spec.ts`,
    text: `import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { ${n.pascal}ListView } from './${n.kebab}-list.view';
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
  const fixture = TestBed.createComponent(${n.pascal}ListView);
  fixture.detectChanges();
  return fixture;
}

describe('${n.pascal}ListView', () => {
  it('renders one row per ${n.camel}', () => {
    const ${n.camelPlural} = [${rowLiteral(spec, '1', 0)}, ${rowLiteral(spec, '2', 1)}];
    const list = render(() => of(${n.camelPlural})).nativeElement.querySelectorAll('li');

    expect(list.length).toBe(2);
    expect(list[0].textContent).toContain('${sampleValue(firstField, 0).replace(/'/g, '')}');
  });

  it('renders the empty state when the list comes back empty', () => {
    const fixture = render(() => of([]));

    expect(fixture.nativeElement.textContent).toContain('No ${n.camelPlural} yet');
  });

  it('surfaces a load failure to the user', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: '${n.opPrefix}.list' };
    const fixture = render(() => throwError(() => err));

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('offline');
  });

  it('reports a failure through the alert primitive', () => {
    const err: AppError = { kind: 'network', message: 'offline', operation: '${n.opPrefix}.list' };
    const alert = render(() => throwError(() => err)).nativeElement.querySelector('[role="alert"]');

    expect(alert.hasAttribute('hlmAlert')).toBe(true);
  });

  it('titles the page with a typography primitive, not a bare heading', () => {
    const heading = render().nativeElement.querySelector('h1');

    expect(heading.hasAttribute('hlmH3')).toBe(true);
  });

  it('renders its list through the typography primitive', () => {
    const list = render().nativeElement.querySelector('ul');

    expect(list.hasAttribute('hlmUl')).toBe(true);
  });
});
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.spec.ts
// shape source: user-form.spec.ts. Since Task 10 made user-form.ts byte-for-byte what
// emit-frontend.ts emits, its spec is the golden suite for the emitted component and all
// six of its tests are reproduced here — minus the two that need a string field (see
// below), which the exemplar has and some specs do not.
// ---------------------------------------------------------------------------

function emitFormSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  const idChecks = spec.fields
    .map((f) => `    expect(host.querySelector('#${f.name}'), 'no control for ${f.name}').toBeTruthy();`)
    .join('\n');

  // Both validation tests read something only emit-frontend.ts's STRING branch produces:
  // `.min(1, '{label} is required')`. A boolean field emits a bare z.boolean(), so an
  // unchecked box is valid — no message to surface, and no value the schema rejects. Taking
  // fields[0] regardless shipped a generated test that threw on a null element for any spec
  // leading with a number or a boolean. So the pair targets the first STRING field, and a
  // spec with none gets neither test rather than one that asserts a message nothing emits.
  // Same guard as emit-dotnet-tests.ts's hasValidatedField.
  const validated = spec.fields.find((f) => f.type === 'string');
  const invalidLiteral = validated
    ? spec.fields.map((f) => `${f.name}: ${f === validated ? `''` : sampleValue(f, 0)}`).join(', ')
    : '';

  // The empty-slot test needs no string field: forms/controls/field-host.ts renders an
  // hlm-field-error for every field whatever its control kind, so any field's slot proves
  // the point.
  const firstField = spec.fields[0];

  const tests = [
    `  it('renders the schema form with a control per field', () => {
    const host = render().nativeElement;

    expect(host.querySelector('app-schema-form')).toBeTruthy();
${idChecks}
  });`,
    `  it('labels the submit button with the action, not the default', () => {
    // The e2e drives this form by that button's accessible name, so the label is
    // load-bearing beyond looking right.
    expect(render().nativeElement.querySelector('button[type="submit"]').textContent.trim()).toBe('Save ${n.camel}');
  });`,
  ];

  if (validated) {
    tests.push(`  it('surfaces the schema validation message on an invalid submit', () => {
    const fixture = render();
    fixture.debugElement.query(By.directive(SchemaForm)).componentInstance.onSubmit(); // every field starts empty

    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-error-for="${validated.name}"]');
    expect(error.textContent).toContain(${tsString(`${validated.label} is required`)});
  });`);
  }

  tests.push(`  it('shows no validation message before the first submit', () => {
    // The error slot is always in the DOM — hlm-field-error keeps its id stable for
    // aria-describedby and hides itself instead of unmounting — so "no message" is an
    // empty slot, not an absent element. Asserting absence here would pass only by
    // accident of how the host happens to render today.
    const error = render().nativeElement.querySelector('[data-error-for="${firstField.name}"]');

    expect(error, 'no error slot rendered for ${firstField.name}').toBeTruthy();
    expect(error.textContent.trim()).toBe('');
  });`);

  tests.push(`  it('narrows the payload SchemaForm emits and re-emits it as the ${n.pascal}FormModel on saved', () => {
    const fixture = render();
    const schemaForm = fixture.debugElement.query(By.directive(SchemaForm)).componentInstance as SchemaForm;
    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    schemaForm.form().setValue({ ${fieldsLiteral(spec, 0)} });
    schemaForm.onSubmit();

    expect(emitted).toEqual({ ${fieldsLiteral(spec, 0)} });
  });`);

  if (validated) {
    tests.push(`  it('does not emit saved when the schema rejects the value', () => {
    const fixture = render();
    const schemaForm = fixture.debugElement.query(By.directive(SchemaForm)).componentInstance as SchemaForm;
    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    schemaForm.form().setValue({ ${invalidLiteral} });
    schemaForm.onSubmit();

    expect(emitted).toBeUndefined();
  });`);
  }

  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.spec.ts`,
    text: `import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ${n.pascal}Form } from './${n.kebab}-form';
import { SchemaForm } from '../../forms/schema-form';
import { provideDefaultFormControls } from '../../forms/controls';

// These assert the RENDERED result, not the wiring that produced it. The component owns no
// control per field to reach into — the schema does — so a test poking at named form
// controls would be testing SchemaForm's internals from the wrong file. What is this
// component's own is: it passes the right schema, it labels its submit button, and it
// re-emits SchemaForm's untyped payload as the model.
function render() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideDefaultFormControls()] });
  const fixture = TestBed.createComponent(${n.pascal}Form);
  fixture.detectChanges();
  return fixture;
}

describe('${n.pascal}Form', () => {
${tests.join('\n\n')}
});
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebabPlural}.commands.spec.ts
// shape source: users.commands.spec.ts
// ---------------------------------------------------------------------------

function emitCommandsSpec(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebabPlural}.commands.spec.ts`,
    text: `import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { new${n.pascal}Command, register${n.pascalPlural}Nav } from './${n.kebabPlural}.commands';
import type { ${n.pascal}ListViewModel } from './${n.kebab}-list.view-model';
import { MenuService } from '../../menu';

describe('new${n.pascal}Command', () => {
  it('opens the form on execute and is disabled while saving', () => {
    const saving = signal(false);
    const openForm = vi.fn();
    const vm = { saving, openForm } as unknown as ${n.pascal}ListViewModel;
    const cmd = new${n.pascal}Command(vm);
    expect(cmd.id).toBe('new-${n.kebab}');
    expect(cmd.canExecute()).toBe(true);
    cmd.execute();
    expect(openForm).toHaveBeenCalled();
    saving.set(true);
    expect(cmd.canExecute()).toBe(false);
  });

  it('register${n.pascalPlural}Nav registers the ${n.kebabPlural} nav command into the sidebar', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const menu = TestBed.inject(MenuService);
    TestBed.runInInjectionContext(() => register${n.pascalPlural}Nav(menu));
    const items = menu.items('sidebar')();
    expect(items.map((c) => c.id)).toEqual(['nav-${n.kebabPlural}']);
    expect(items[0].label).toBe('${label(n.kebabPlural)}');
  });
});
`,
  };
}

/**
 * Emit the five Angular test files that accompany a generated slice's production
 * code: the operations facade spec, the list ViewModel spec, the list view spec, the
 * form component spec, and the nav/action commands spec. There is no form-ViewModel
 * spec — see the module comment above.
 */
export function emitFrontendTests(spec: SliceSpec): EmittedFile[] {
  const n = deriveNames(spec);
  return [
    emitOperationsSpec(spec, n),
    emitListViewModelSpec(spec, n),
    emitListViewSpec(spec, n),
    emitFormSpec(spec, n),
    emitCommandsSpec(n),
  ];
}
