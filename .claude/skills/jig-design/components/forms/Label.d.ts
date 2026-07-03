import * as React from 'react';

/** Form control label. Mirrors Spartan `[hlmLabel]` — 14px, medium weight. */
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label(props: LabelProps): React.JSX.Element;
