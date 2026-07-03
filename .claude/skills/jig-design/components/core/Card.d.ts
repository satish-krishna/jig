import * as React from 'react';

/**
 * Content surface: bordered, radius-xl, subtle shadow-sm. Compose with the
 * Header/Title/Description/Content/Footer parts — each supplies its own
 * horizontal padding so children align to the same 24px gutter.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card(props: CardProps): React.JSX.Element;
export function CardHeader(props: CardProps): React.JSX.Element;
export function CardTitle(props: CardProps): React.JSX.Element;
export function CardDescription(props: CardProps): React.JSX.Element;
export function CardContent(props: CardProps): React.JSX.Element;
export function CardFooter(props: CardProps): React.JSX.Element;
