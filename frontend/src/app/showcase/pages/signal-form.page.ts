import { Component, signal } from '@angular/core';
import { FormField, form, submit, validateStandardSchema } from '@angular/forms/signals';
import { z } from 'zod';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import type { FormFieldMeta } from '../../forms/form-field-meta';
import { formMeta } from '../../forms/zod-meta';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * The page's own schema rather than the users slice's, so the showcase never
 * depends on a feature. It is also what a reader copies: the pattern is that you
 * author the schema and the form together.
 */
const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .meta({ label: 'Display name', control: 'text', placeholder: 'Ada', order: 1 } satisfies FormFieldMeta),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .meta({ label: 'Email address', control: 'email', placeholder: 'ada@example.io', order: 2 } satisfies FormFieldMeta),
});

type Profile = z.infer<typeof profileSchema>;

const EMPTY: Profile = { displayName: '', email: '' };

/**
 * Signal-forms usages: the compile-time half of docs/architecture/forms.md.
 *
 * Each usage gets its own model and form because they demonstrate different
 * states of the same pattern, and a shared instance would make one usage's
 * interaction change another's. `features/users/user-form.ts` stays the
 * canonical reference; this page documents the shape, it does not fork it.
 */
@Component({
  selector: 'app-signal-form-page',
  imports: [FormField, ComponentPage, Usage, HlmFieldImports, HlmInputImports, HlmButtonImports],
  template: `
    <app-component-page slug="signal-form">
      <app-usage
        title="An authored form"
        note="The model type is z.infer — never a hand-written interface. Reference: features/users/user-form.ts."
        [code]="codeAuthored"
      >
        <form hlmFieldGroup class="grid w-full max-w-sm" (submit)="onAuthoredSubmit($event)">
          <hlm-field>
            <label hlmFieldLabel for="authored-displayName">{{ meta['displayName'].label }}</label>
            <input
              hlmInput
              id="authored-displayName"
              [formField]="authoredForm.displayName"
              [attr.placeholder]="meta['displayName'].placeholder ?? null"
            />
            @for (error of authoredForm.displayName().errors(); track error.kind) {
              <hlm-field-error data-error-for="displayName">{{ error.message }}</hlm-field-error>
            }
          </hlm-field>

          <hlm-field>
            <label hlmFieldLabel for="authored-email">{{ meta['email'].label }}</label>
            <input
              hlmInput
              id="authored-email"
              [formField]="authoredForm.email"
              [attr.placeholder]="meta['email'].placeholder ?? null"
            />
            @for (error of authoredForm.email().errors(); track error.kind) {
              <hlm-field-error data-error-for="email">{{ error.message }}</hlm-field-error>
            }
          </hlm-field>

          <button hlmBtn type="submit">Save profile</button>

          @if (authoredSaved(); as saved) {
            <p class="text-muted-foreground font-mono text-xs">saved {{ saved.displayName }}</p>
          }
        </form>
      </app-usage>

      <app-usage
        title="Labels come from the schema"
        note="formMeta(schema) reads .meta() off each field. No label string is written in the template."
        [code]="codeMeta"
      >
        <div class="grid w-full max-w-sm gap-l">
          <form hlmFieldGroup>
            @for (field of metaFields; track field) {
              <hlm-field>
                <label hlmFieldLabel [attr.for]="'meta-' + field">{{ meta[field].label }}</label>
                <input
                  hlmInput
                  [id]="'meta-' + field"
                  [formField]="metaForm[field]"
                  [attr.placeholder]="meta[field].placeholder ?? null"
                />
              </hlm-field>
            }
          </form>
          <pre
            class="border-border bg-muted/40 overflow-x-auto rounded-md border px-m py-s font-mono text-xs"
          >{{ metaSummary }}</pre>
        </div>
      </app-usage>

      <app-usage
        title="Validation is native zod"
        note="Pre-filled with a bad address and touched, so the schema's own message is on screen."
        [code]="codeValidation"
      >
        <form hlmFieldGroup class="grid w-full max-w-sm">
          <hlm-field>
            <label hlmFieldLabel for="zod-email">{{ meta['email'].label }}</label>
            <input hlmInput id="zod-email" [formField]="zodForm.email" />
            @for (error of zodForm.email().errors(); track error.kind) {
              <hlm-field-error data-error-for="email">{{ error.message }}</hlm-field-error>
            }
          </hlm-field>
        </form>
      </app-usage>

      <app-usage
        title="Submit runs only when valid"
        note="submit() never invokes its callback on an invalid form, so there is no guard to forget."
        [code]="codeGate"
      >
        <form hlmFieldGroup class="grid w-full max-w-sm" (submit)="onGateSubmit($event)">
          <hlm-field>
            <label hlmFieldLabel for="gate-displayName">{{ meta['displayName'].label }}</label>
            <input hlmInput id="gate-displayName" [formField]="gateForm.displayName" />
          </hlm-field>
          <hlm-field>
            <label hlmFieldLabel for="gate-email">{{ meta['email'].label }}</label>
            <input hlmInput id="gate-email" [formField]="gateForm.email" />
          </hlm-field>

          <button hlmBtn type="submit">Submit</button>

          @if (gatePayload(); as payload) {
            <pre
              data-slot="payload"
              class="border-border bg-muted/40 overflow-x-auto rounded-md border px-m py-s font-mono text-xs"
            >{{ payload }}</pre>
          } @else {
            <p class="text-muted-foreground text-xs">
              Nothing submitted — fill both fields with valid values.
            </p>
          }
        </form>
      </app-usage>
    </app-component-page>
  `,
})
export class SignalFormPage {
  protected readonly meta = formMeta(profileSchema);
  protected readonly metaFields = Object.keys(this.meta) as (keyof Profile)[];
  protected readonly metaSummary = JSON.stringify(this.meta, null, 2);

  protected readonly authoredModel = signal<Profile>({ ...EMPTY });
  protected readonly authoredForm = form(this.authoredModel, (p) =>
    validateStandardSchema(p, profileSchema),
  );
  protected readonly authoredSaved = signal<Profile | undefined>(undefined);

  protected readonly metaModel = signal<Profile>({ ...EMPTY });
  protected readonly metaForm = form(this.metaModel, (p) =>
    validateStandardSchema(p, profileSchema),
  );

  protected readonly zodModel = signal<Profile>({ displayName: 'Ada', email: 'not-an-address' });
  protected readonly zodForm = form(this.zodModel, (p) => validateStandardSchema(p, profileSchema));

  protected readonly gateModel = signal<Profile>({ ...EMPTY });
  protected readonly gateForm = form(this.gateModel, (p) =>
    validateStandardSchema(p, profileSchema),
  );
  protected readonly gatePayload = signal<string | undefined>(undefined);

  constructor() {
    // hlm-field-error hides itself until the field is touched, which is right for
    // a form a user just opened and wrong for a static example of the error state.
    this.zodForm.email().markAsTouched();
  }

  protected async onAuthoredSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.authoredForm.displayName().markAsTouched();
    this.authoredForm.email().markAsTouched();
    await submit(this.authoredForm, async () => this.authoredSaved.set(this.authoredModel()));
  }

  protected async onGateSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.gateForm, async () =>
      this.gatePayload.set(JSON.stringify(this.gateModel(), null, 2)),
    );
  }

  protected readonly codeAuthored = `const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required')
    .meta({ label: 'Display name', control: 'text' } satisfies FormFieldMeta),
});
type Profile = z.infer<typeof profileSchema>;   // never hand-written

model = signal<Profile>({ displayName: '', email: '' });
form = form(this.model, (p) => validateStandardSchema(p, profileSchema));

<input hlmInput [formField]="form.displayName" />
@for (error of form.displayName().errors(); track error.kind) {
  <hlm-field-error>{{ error.message }}</hlm-field-error>
}`;

  protected readonly codeMeta = `// Labels and placeholders ride on the schema via .meta(), read back with formMeta.
meta = formMeta(profileSchema);

<label hlmFieldLabel for="email">{{ meta['email'].label }}</label>
<input hlmInput id="email" [formField]="form.email"
       [attr.placeholder]="meta['email'].placeholder ?? null" />`;

  protected readonly codeValidation = `// zod 4 is a Standard Schema, so Angular validates through it natively.
// The message lives in the schema and is never restated as a validator.
email: z.string().email('Enter a valid email')

form = form(this.model, (p) => validateStandardSchema(p, profileSchema));
form.email().errors();   // [{ kind: 'email', message: 'Enter a valid email' }]`;

  protected readonly codeGate = `// submit() checks validity itself; the callback simply does not run otherwise.
await submit(this.form, async () => {
  this.payload.set(JSON.stringify(this.model()));
});`;
}
