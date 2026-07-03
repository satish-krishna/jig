import React from 'react';

/** Jig Card — bordered, softly elevated surface. shadcn card. */
export function Card({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card__header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card__title', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card__description', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card__content', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={['hlm-card__footer', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
