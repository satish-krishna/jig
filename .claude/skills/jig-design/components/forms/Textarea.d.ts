import * as React from 'react';

/** Multi-line text field. Shares the Input skin; grows vertically. */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea(props: TextareaProps): React.JSX.Element;
