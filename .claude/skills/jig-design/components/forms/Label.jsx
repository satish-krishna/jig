import React from 'react';

/** Jig Label — Spartan `hlmLabel`. */
export function Label({ className = '', children, ...props }) {
  return (
    <label className={['hlm-label', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </label>
  );
}
