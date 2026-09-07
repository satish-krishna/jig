// Does the committed generated code still match what the API would emit?
//
// `frontend/src/app/contracts/generated/api-types.ts` and `contracts/openapi/openapi.json`
// are committed artifacts that, until this file existed, nothing verified. A .NET contract
// change with no `npm run codegen` left the frontend compiling happily against stale types
// while the API served a different shape, and the gate stayed green the whole way.
//
// Freshness is not compatibility, and the gate needs both. This is the freshness half: it
// proves the generated files match the spec. The Angular AOT build is the compatibility
// half, which is why a `contracts` change runs that build too.

/** One generated artifact, as committed and as freshly emitted. `committed` is null when absent. */
export interface Artifact {
  label: string;
  committed: string | null;
  fresh: string;
}

export interface DriftResult {
  ok: boolean;
  message: string;
}

/**
 * Compare on content, not bytes.
 *
 * `.gitattributes` normalizes the repo to LF, but `openapi-typescript` writing into a temp
 * directory on Windows can still emit CRLF, and a trailing newline comes and goes depending
 * on which tool wrote last. Neither is drift. A gate that failed on either would be red on
 * every Windows run for a reason nobody could act on, and a gate that cries wolf gets
 * routed around — the same argument ADR 0009 makes about suppression dials.
 */
const normalize = (text: string): string => text.replace(/\r\n/g, '\n').replace(/\n+$/, '');

/** Whether every generated artifact still matches the API, and what to say when it does not. */
export function compareArtifacts(artifacts: readonly Artifact[]): DriftResult {
  const drifted = artifacts.filter(
    (a) => a.committed === null || normalize(a.committed) !== normalize(a.fresh),
  );

  if (drifted.length === 0) {
    return { ok: true, message: 'codegen: generated contracts are in sync with the API.' };
  }

  const lines = drifted.map((a) =>
    a.committed === null ? `  ${a.label} — missing; codegen would create it` : `  ${a.label} — drifted`,
  );

  return {
    ok: false,
    message:
      'codegen: the committed contracts no longer match what the API emits.\n' +
      lines.join('\n') +
      '\nThese files are generated, never authored. Run `npm run codegen` and commit the result.',
  };
}
