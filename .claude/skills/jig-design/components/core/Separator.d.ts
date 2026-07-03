import * as React from 'react';

/** A thin rule dividing content. 1px, uses `--border`. */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
}

export function Separator(props: SeparatorProps): React.JSX.Element;
