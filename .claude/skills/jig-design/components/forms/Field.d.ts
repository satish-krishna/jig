import * as React from 'react';

/**
 * Form field group. Mirrors Spartan `[hlmField]` — stacks Label + control
 * + description/error with 8px gaps. Use `horizontal` for inline checkbox/
 * switch rows.
 */
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
}

export function Field(props: FieldProps): React.JSX.Element;
export function FieldDescription(
  props: React.HTMLAttributes<HTMLParagraphElement>,
): React.JSX.Element;
export function FieldError(
  props: React.HTMLAttributes<HTMLParagraphElement>,
): React.JSX.Element;
