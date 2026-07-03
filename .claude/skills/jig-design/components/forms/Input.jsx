import React from 'react';

/** Jig Input — Spartan `hlmInput`. 32px tall, transparent bg, ring on focus. */
export function Input({ className = '', invalid, ...props }) {
  const cls = ['hlm-input', className].filter(Boolean).join(' ');
  return <input className={cls} aria-invalid={invalid || undefined} {...props} />;
}
