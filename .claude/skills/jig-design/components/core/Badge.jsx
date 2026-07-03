import React from 'react';

/** Jig Badge — small status / metadata pill. shadcn badge. */
export function Badge({ variant = 'default', className = '', children, ...props }) {
  const cls = ['hlm-badge', `hlm-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}
