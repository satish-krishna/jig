import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { z } from 'zod';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { FormFieldMeta } from '../../forms/form-field-meta';
import { SchemaForm } from '../../forms/schema-form';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .meta({ label: 'Name', control: 'text', placeholder: 'Ada Lovelace', order: 1 } satisfies FormFieldMeta),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .meta({ label: 'Email', control: 'email', placeholder: 'ada@example.io', order: 2 } satisfies FormFieldMeta),
  message: z
    .string()
    .min(1, 'Message is required')
    .meta({ label: 'Message', control: 'textarea', placeholder: 'What do you need?', order: 3 } satisfies FormFieldMeta),
});

/** One field per ControlKind, so the switch in schema-form.ts is legible in one place. */
const everyKindSchema = z.object({
  title: z.string().meta({ label: 'Text', control: 'text', order: 1 } satisfies FormFieldMeta),
  contact: z.string().meta({ label: 'Email', control: 'email', order: 2 } satisfies FormFieldMeta),
  // coerce, because an <input type="number"> hands Angular a string
  retries: z.coerce.number().meta({ label: 'Number', control: 'number', order: 3 } satisfies FormFieldMeta),
  tier: z.string().meta({
    label: 'Select',
    control: 'select',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ],
    order: 4,
  } satisfies FormFieldMeta),
  agreed: z.boolean().meta({ label: 'Checkbox', control: 'checkbox', order: 5 } satisfies FormFieldMeta),
  notes: z.string().meta({ label: 'Textarea', control: 'textarea', order: 6 } satisfies FormFieldMeta),
});

const serverSchema = z.object({
  host: z
    .string()
    .min(1, 'Host is required')
    .meta({ label: 'Host', control: 'text', placeholder: 'localhost', order: 1 } satisfies FormFieldMeta),
  port: z.coerce
    .number()
    .meta({ label: 'Port', control: 'number', order: 2 } satisfies FormFieldMeta),
  tls: z.boolean().meta({ label: 'Require TLS', control: 'checkbox', order: 3 } satisfies FormFieldMeta),
});

/**
 * SchemaForm usages. This page is the component's first consumer in the app —
 * the users slice hand-authors its form through signal-forms instead — so the
 * examples here are also what proves the renderer works end to end.
 */
@Component({
  selector: 'app-schema-form-page',
  imports: [JsonPipe, ComponentPage, Usage, SchemaForm, HlmButtonImports],
  template: `
    <app-component-page slug="schema-form">
      <app-usage
        title="Render a schema"
        note="The schema is the only input; the output is already parsed and valid."
        [code]="codeBasic"
      >
        <div class="grid w-full max-w-sm gap-l">
          <app-schema-form [schema]="contact" submitLabel="Send" (submitted)="sent.set($event)" />
          @if (sent(); as value) {
            <pre
              class="border-border bg-muted/40 overflow-x-auto rounded-md border px-m py-s font-mono text-xs"
            >{{ value | json }}</pre>
          }
        </div>
      </app-usage>

      <app-usage
        title="Every control kind"
        note="Six ControlKind values, four switch branches — text, email and number share the default input."
        [code]="codeKinds"
      >
        <div class="grid w-full max-w-sm">
          <app-schema-form [schema]="everyKind" submitLabel="Save" />
        </div>
      </app-usage>

      <app-usage
        title="Validation folds back onto the fields"
        note="Press Send with the form empty — each zod message lands under the field that raised it."
        [code]="codeValidation"
      >
        <div class="grid w-full max-w-sm">
          <app-schema-form [schema]="contact" submitLabel="Send" />
        </div>
      </app-usage>

      <app-usage
        title="The schema is an input"
        note="Swap it and the whole form is rebuilt. This is what separates the renderer from a hand-written form."
        [code]="codeSwap"
      >
        <div class="grid w-full max-w-sm gap-l">
          <!-- one inline run of two buttons: flex, not grid -->
          <div class="flex gap-s">
            <button
              hlmBtn
              size="xs"
              id="swap-to-contact"
              [variant]="showServer() ? 'outline' : 'default'"
              (click)="showServer.set(false)"
            >
              contact
            </button>
            <button
              hlmBtn
              size="xs"
              id="swap-to-server"
              [variant]="showServer() ? 'default' : 'outline'"
              (click)="showServer.set(true)"
            >
              server
            </button>
          </div>
          <app-schema-form [schema]="swapped()" submitLabel="Apply" />
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SchemaFormPage {
  protected readonly contact = contactSchema;
  protected readonly everyKind = everyKindSchema;

  protected readonly sent = signal<Record<string, unknown> | undefined>(undefined);
  protected readonly showServer = signal(false);
  protected readonly swapped = computed(() => (this.showServer() ? serverSchema : contactSchema));

  protected readonly codeBasic = `const contactSchema = z.object({
  name: z.string().min(1, 'Name is required')
    .meta({ label: 'Name', control: 'text' } satisfies FormFieldMeta),
  message: z.string().min(1, 'Message is required')
    .meta({ label: 'Message', control: 'textarea' } satisfies FormFieldMeta),
});

<app-schema-form [schema]="contactSchema" submitLabel="Send" (submitted)="sent.set($event)" />`;

  protected readonly codeKinds = `// ControlKind = 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea'
// The @switch in schema-form.ts branches on textarea, select and checkbox;
// text, email and number all fall through to <input [type]>.
retries: z.coerce.number()   // coerce: the input hands Angular a string
  .meta({ label: 'Number', control: 'number' } satisfies FormFieldMeta),
tier: z.string().meta({
  label: 'Select', control: 'select',
  options: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }],
} satisfies FormFieldMeta),`;

  protected readonly codeValidation = `// onSubmit runs schema.safeParse, then applyZodIssues writes each issue
// onto the control named by issue.path[0]. Nothing is restated as a validator.
const result = this.schema().safeParse(form.getRawValue());
if (result.success) this.submitted.emit(result.data);
else applyZodIssues(form, result.error);`;

  protected readonly codeSwap = `// fields() and form() are computed from schema(), so a new schema
// rebuilds the FormGroup — no imperative teardown.
protected readonly swapped = computed(() => showServer() ? serverSchema : contactSchema);

<app-schema-form [schema]="swapped()" submitLabel="Apply" />`;
}
