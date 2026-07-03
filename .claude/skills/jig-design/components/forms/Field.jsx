import React from 'react';

/**
 * Jig Field — Spartan `hlmField`. Groups a label, control, and
 * description/error with consistent 8px vertical rhythm.
 */
export function Field({ orientation = 'vertical', className = '', children, ...props }) {
  const cls = [
    'hlm-field',
    orientation === 'horizontal' ? 'hlm-field--horizontal' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div role="group" className={cls} {...props}>
      {children}
    </div>
  );
}

export function FieldDescription({ className = '', children, ...props }) {
  return (
    <p className={['hlm-field__description', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  );
}

export function FieldError({ className = '', children, ...props }) {
  return (
    <p className={['hlm-field__error', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  );
}
