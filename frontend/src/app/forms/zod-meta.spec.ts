import { describe, it, expect } from 'vitest';
import { formMeta } from './zod-meta';
import { userFormSchema } from '../features/users/user-form.schema';

describe('formMeta', () => {
  it('reads label and control kind from each schema field', () => {
    const meta = formMeta(userFormSchema);
    expect(meta['name'].label).toBe('Name');
    expect(meta['name'].control).toBe('text');
    expect(meta['email'].label).toBe('Email');
    expect(meta['email'].control).toBe('email');
  });
});
