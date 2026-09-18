// Angular production emitters for the vertical-slice generator. Six pure functions, one
// per TypeScript file, each reproducing the shape of the `users` reference slice
// (frontend/src/app/features/users) with the spec's own names substituted in. No disk
// access here — the CLI (a later task) decides where these EmittedFile entries land.
//
// The form is rendered through SchemaForm, not hand-wired: no {kebab}-form.view-model.ts
// is emitted. frontend/src/app/features/users/user-form.ts predates the control registry
// and hand-wires an <hlm-field> per field; that is a stale exemplar, not the shape to
// follow (see add-a-form/SKILL.md step 5). The schema file below carries every field's
// shape, validation, and control kind, and the form component wires nothing per field.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { label } from './naming.ts';

// ---------------------------------------------------------------------------
// The zod-type fragment and per-field .meta() block, shared by the schema file.
// Copied verbatim from the task brief: it reproduces user-form.schema.ts's shape
// field by field, decimal validation for strings, the email validator, and the
// FormFieldMeta the control registry (and SchemaForm) reads to render and label it.
// ---------------------------------------------------------------------------

const ZOD_TYPE: Record<FieldSpec['type'], string> = {
  string: 'z\n    .string()',
  number: 'z\n    .number()',
  boolean: 'z\n    .boolean()',
};

function zodField(f: FieldSpec, order: number): string {
  const lines = [`  ${f.name}: ${ZOD_TYPE[f.type]}`];
  if (f.type === 'string') lines.push(`    .min(1, '${f.label} is required')`);
  if (f.format === 'email') lines.push(`    .email('Enter a valid email')`);
  const meta = [`label: '${f.label}'`];
  if (f.format) meta.push(`control: '${f.format}'`);
  if (f.placeholder) meta.push(`placeholder: '${f.placeholder}'`);
  meta.push(`order: ${order}`);
  lines.push(`    .meta({ ${meta.join(', ')} } satisfies FormFieldMeta),`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// frontend/src/app/operations/{kebab}.operations.ts — shape source: user.operations.ts
// ---------------------------------------------------------------------------

function emitOperations(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/operations/${n.kebab}.operations.ts`,
    text: `import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Save${n.pascal}Input, ${n.pascal}Dto } from '../contracts';
import { Transport } from '../transport';

/**
 * The ${n.camel} operations facade: speaks operations, never URLs or command names.
 * Identical across both wires because it only ever talks to the Transport port.
 *
 * @capability operations.${n.camel}
 * @intent Domain-facing ${n.camel} data access that is oblivious to the transport underneath.
 * @reuse Inject ${n.pascal}Operations from ViewModels; copy this shape for new feature facades.
 */
@Injectable({ providedIn: 'root' })
export class ${n.pascal}Operations {
  private readonly transport = inject(Transport);

  list(): Observable<${n.pascal}Dto[]> {
    return this.transport.request('${n.opPrefix}.list', {});
  }

  get(id: string): Observable<${n.pascal}Dto> {
    return this.transport.request('${n.opPrefix}.get', { id });
  }

  save(${n.camel}: Save${n.pascal}Input): Observable<${n.pascal}Dto> {
    return this.transport.request('${n.opPrefix}.save', ${n.camel});
  }
}
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view-model.ts
// shape source: user-list.view-model.ts
// ---------------------------------------------------------------------------

function emitListViewModel(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view-model.ts`,
    text: `import { Injectable, inject, signal } from '@angular/core';
import type { Save${n.pascal}Input, ${n.pascal}Dto } from '../../contracts';
import type { AppError } from '../../transport';
import { ${n.pascal}Operations } from '../../operations/${n.kebab}.operations';

/**
 * ViewModel for the ${n.kebabPlural} slice. Exposes signals only; the View binds to them
 * and never touches a facade or transport. Depends on ${n.pascal}Operations, which speaks
 * operations, so this class is identical regardless of which transport is underneath.
 */
@Injectable()
export class ${n.pascal}ListViewModel {
  private readonly ops = inject(${n.pascal}Operations);

  readonly ${n.camelPlural} = signal<${n.pascal}Dto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);

  openForm(): void { this.formOpen.set(true); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ops.list().subscribe({
      next: (${n.camelPlural}) => {
        this.${n.camelPlural}.set(${n.camelPlural});
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  save(input: Save${n.pascal}Input): void {
    this.error.set(null);
    this.saving.set(true);
    this.ops.save(input).subscribe({
      next: () => { this.saving.set(false); this.formOpen.set(false); this.load(); },
      error: (err: AppError) => { this.saving.set(false); this.error.set(err); },
    });
  }
}
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view.ts
// shape source: user-list.view.ts
// ---------------------------------------------------------------------------

function emitListView(spec: SliceSpec, n: SliceNames): EmittedFile {
  const row = spec.fields.map((f) => `{{ ${n.camel}.${f.name} }}`).join(' · ');
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view.ts`,
    text: `import { Component, OnInit, inject } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { MenuService } from '../../menu';
import { ${n.pascal}Form } from './${n.kebab}-form';
import type { ${n.pascal}FormModel } from './${n.kebab}-form.schema';
import { ${n.pascal}ListViewModel } from './${n.kebab}-list.view-model';
import { new${n.pascal}Command } from './${n.kebabPlural}.commands';

/**
 * The ${n.kebabPlural} slice view. Binds only to the ViewModel's signals and the form
 * component. It has no idea a transport or a repository exists.
 */
@Component({
  selector: 'app-${n.kebab}-list',
  imports: [${n.pascal}Form, HlmTypographyImports, HlmAlertImports],
  providers: [${n.pascal}ListViewModel],
  template: \`
    <section class="grid gap-m">
      <h1 hlmH3>${n.pascalPlural}</h1>

      @if (vm.formOpen()) {
        <app-${n.kebab}-form (saved)="onSaved($event)" />
      }

      @if (vm.loading()) {
        <p hlmMuted>Loading...</p>
      }
      @if (vm.error(); as err) {
        <div hlmAlert variant="destructive">
          <p hlmAlertDescription>{{ err.message }}</p>
        </div>
      }

      <ul hlmUl>
        @for (${n.camel} of vm.${n.camelPlural}(); track ${n.camel}.id) {
          <li>${row}</li>
        } @empty {
          <li hlmMuted>No ${n.camelPlural} yet.</li>
        }
      </ul>
    </section>
  \`,
})
export class ${n.pascal}ListView implements OnInit {
  protected readonly vm = inject(${n.pascal}ListViewModel);

  constructor() {
    const menu = inject(MenuService);
    menu.register('header', new${n.pascal}Command(this.vm));
  }

  ngOnInit(): void {
    this.vm.load();
  }

  onSaved(value: ${n.pascal}FormModel): void {
    this.vm.save(value);
  }
}
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.schema.ts
// shape source: user-form.schema.ts
// ---------------------------------------------------------------------------

function emitFormSchema(spec: SliceSpec, n: SliceNames): EmittedFile {
  const fields = spec.fields.map((f, i) => zodField(f, i + 1)).join('\n');
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.schema.ts`,
    text: `import { z } from 'zod';
import type { FormFieldMeta } from '../../forms/form-field-meta';

/**
 * The one source of truth for the create/edit ${n.camel} form: shape, validation, and
 * field presentation all live here. The model type is inferred, never hand-written.
 */
export const ${n.camel}FormSchema = z.object({
${fields}
});

export type ${n.pascal}FormModel = z.infer<typeof ${n.camel}FormSchema>;
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.ts
// shape source: showcase/pages/schema-form.page.ts (SchemaForm's real usage)
// ---------------------------------------------------------------------------

function emitForm(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.ts`,
    text: `import { Component, output } from '@angular/core';
import { SchemaForm } from '../../forms/schema-form';
import { ${n.camel}FormSchema, type ${n.pascal}FormModel } from './${n.kebab}-form.schema';

/**
 * The ${n.camel} create/edit form. Renders entirely through SchemaForm: the schema
 * carries every field's shape, validation, and control kind, so this component
 * wires nothing per field and holds no form state of its own.
 */
@Component({
  selector: 'app-${n.kebab}-form',
  imports: [SchemaForm],
  template: \`<app-schema-form [schema]="${n.camel}FormSchema" submitLabel="Save ${n.camel}" (submitted)="onSubmitted($event)" />\`,
})
export class ${n.pascal}Form {
  protected readonly ${n.camel}FormSchema = ${n.camel}FormSchema;
  readonly saved = output<${n.pascal}FormModel>();

  // SchemaForm.submitted is output<Record<string, unknown>> because it renders a
  // schema it only knows about at runtime; Angular templates have no \`as\`, so the
  // narrowing to this form's own model has to happen here rather than inline in the
  // binding above. It only ever emits after safeParse against ${n.camel}FormSchema (the
  // very schema passed to it above), so the payload is this model by construction.
  protected onSubmitted(value: Record<string, unknown>): void {
    this.saved.emit(value as ${n.pascal}FormModel);
  }
}
`,
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebabPlural}.commands.ts
// shape source: users.commands.ts
// ---------------------------------------------------------------------------

function emitCommands(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebabPlural}.commands.ts`,
    text: `import { computed, inject, provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { MenuService, navigateCommand, type Command } from '../../menu';
import { ${n.pascal}ListViewModel } from './${n.kebab}-list.view-model';

/** The ${n.kebabPlural} slice's action command: opens the create form, disabled mid-save. */
export function new${n.pascal}Command(vm: ${n.pascal}ListViewModel): Command {
  return {
    id: 'new-${n.kebab}',
    label: 'new ${label(n.kebab)}',
    icon: 'lucidePlus',
    canExecute: computed(() => !vm.saving()),
    execute: () => vm.openForm(),
  };
}

/**
 * Registers the ${n.kebabPlural} NAV command app-wide (it must be reachable from anywhere,
 * so it lives for the app's lifetime — provideAppInitializer runs in the root
 * injection context). The ACTION command is registered view-scoped in the view.
 */
export function register${n.pascalPlural}Nav(menu: MenuService): void {
  menu.register('sidebar', navigateCommand({ id: 'nav-${n.kebabPlural}', label: '${label(n.kebabPlural)}', icon: '${spec.icon}', route: '${n.route}' }));
}

export function provide${n.pascalPlural}Menu(): EnvironmentProviders {
  return provideAppInitializer(() => register${n.pascalPlural}Nav(inject(MenuService)));
}
`,
  };
}

/**
 * Emit the six Angular files that make up the frontend half of a vertical slice: the
 * operations facade, the list ViewModel and view, the form schema and its thin
 * SchemaForm wrapper, and the nav/action commands file. `spec` has no product
 * parameter — the frontend has no per-clone namespace to substitute.
 */
export function emitFrontend(spec: SliceSpec): EmittedFile[] {
  const n = deriveNames(spec);
  return [
    emitOperations(n),
    emitListViewModel(n),
    emitListView(spec, n),
    emitFormSchema(spec, n),
    emitForm(n),
    emitCommands(spec, n),
  ];
}
