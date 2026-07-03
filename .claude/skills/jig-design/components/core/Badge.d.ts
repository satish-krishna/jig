import * as React from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Small inline pill for status, counts, or metadata labels.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default 'default' */
  variant?: BadgeVariant;
}

export function Badge(props: BadgeProps): React.JSX.Element;
