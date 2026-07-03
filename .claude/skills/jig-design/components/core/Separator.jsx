import React from 'react';

/** Jig Separator — 1px divider. shadcn / hlm-separator. */
export function Separator({ orientation = 'horizontal', className = '', ...props }) {
  const cls = ['hlm-separator', `hlm-separator--${orientation}`, className]
    .filter(Boolean)
    .join(' ');
  return <div role="separator" aria-orientation={orientation} className={cls} {...props} />;
}
