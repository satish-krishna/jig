import React from 'react';

/** Jig Textarea — the input skin, multi-line and vertically resizable. */
export function Textarea({ className = '', invalid, rows = 4, ...props }) {
  const cls = ['hlm-input', 'hlm-textarea', className].filter(Boolean).join(' ');
  return <textarea className={cls} rows={rows} aria-invalid={invalid || undefined} {...props} />;
}
