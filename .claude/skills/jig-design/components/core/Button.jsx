import React from 'react';

/**
 * Jig Button — Spartan `hlmBtn`.
 * Concrete variants/sizes translated from hlm-button.ts.
 */
export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  as: As = 'button',
  children,
  ...props
}) {
  const cls = [
    'hlm-btn',
    `hlm-btn--${variant}`,
    size !== 'default' ? `hlm-btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <As className={cls} {...props}>
      {children}
    </As>
  );
}
