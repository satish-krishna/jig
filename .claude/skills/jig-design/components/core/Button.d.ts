import * as React from 'react';

export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link';

export type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';

/**
 * Primary action control. Mirrors Spartan `button[hlmBtn]`.
 * Compact by default (32px tall). Use `icon*` sizes for square icon buttons.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'default' */
  variant?: ButtonVariant;
  /** Control size. @default 'default' */
  size?: ButtonSize;
  /** Render as a different element (e.g. 'a'). @default 'button' */
  as?: React.ElementType;
}

export function Button(props: ButtonProps): React.JSX.Element;
