import * as React from 'react';

/**
 * Text input. Mirrors Spartan `[hlmInput]` — 32px tall, transparent
 * background, focus ring. Set `invalid` (or `aria-invalid`) for the error state.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Render the invalid ring/border. */
  invalid?: boolean;
}

export function Input(props: InputProps): React.JSX.Element;
