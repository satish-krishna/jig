/** Shapes for the generated API map. Hand-written; the data is not. */
export interface ApiMember {
  readonly kind: 'input' | 'output' | 'model';
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
}

export interface ApiClass {
  readonly className: string;
  readonly selector: string;
  readonly members: readonly ApiMember[];
}
