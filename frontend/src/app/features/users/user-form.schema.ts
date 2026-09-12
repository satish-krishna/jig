import { z } from 'zod';
import type { FormFieldMeta } from '../../forms/form-field-meta';

/**
 * The one source of truth for the create/edit user form: shape, validation, and
 * field presentation all live here. The model type is inferred, never hand-written.
 */
export const userFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .meta({ label: 'Name', placeholder: 'Ada Lovelace', order: 1 } satisfies FormFieldMeta),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .meta({ label: 'Email', control: 'email', placeholder: 'ada@example.io', order: 2 } satisfies FormFieldMeta),
});

export type UserFormModel = z.infer<typeof userFormSchema>;
