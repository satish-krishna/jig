// Capability annotation parser for the Jig catalog generator.
//
// Scans source text for machine-parseable capability blocks embedded in each
// language's native doc-comment format (TSDoc, rustdoc, C# XML doc) and returns
// one entry per annotated symbol. This is the single place that knows how a
// capability block is written, so the CLI and any test key off the same shape.
//
// This is build tooling, not a cataloged application capability, so it is
// deliberately excluded from the scan (see SCAN_DIRS in catalog.ts).

/** A single reusable-unit capability, as it lands in catalog.json. */
export type CapabilityEntry = {
  capability: string;
  intent: string;
  reuse: string;
  file: string;
  language: 'typescript' | 'rust' | 'csharp';
  symbol: string;
};

export function languageFor(filePath: string): CapabilityEntry['language'] | null {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.rs')) return 'rust';
  if (filePath.endsWith('.cs')) return 'csharp';
  return null;
}

const DECL_KEYWORDS = new Set([
  'class', 'interface', 'struct', 'enum', 'fn', 'function', 'const', 'let',
  'var', 'type', 'record', 'trait', 'impl', 'mod', 'namespace', 'def',
]);

/** Strip the comment markers from one doc line, leaving its payload. */
function cleanLine(line: string): string {
  return line
    .trim()
    .replace(/^\/\*\*/, '')
    .replace(/\*\/\s*$/, '')
    .replace(/^\/\/\/?/, '')
    .replace(/^\*\s?/, '')
    .trim();
}

function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t === '';
}

/** A line that decorates the following symbol rather than declaring it. */
function isDecoratorLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('@') || t.startsWith('#[') || t.startsWith('[');
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Pull the declared identifier out of the first real code line after a block. */
function symbolFrom(lines: string[], start: number): string {
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line) || isDecoratorLine(line) || line.trim() === '') continue;
    const tokens = line.trim().split(/[\s(){}<>:;]+/).filter(Boolean);
    const kw = tokens.findIndex((t) => DECL_KEYWORDS.has(t));
    const raw = kw >= 0 ? tokens[kw + 1] : tokens[0];
    if (!raw) return '';
    return raw.replace(/[<(].*$/, '').replace(/[^\w$]/g, '');
  }
  return '';
}

export function parseAnnotations(text: string, filePath: string): CapabilityEntry[] {
  const language = languageFor(filePath);
  if (!language) return [];

  const lines = text.split(/\r?\n/);
  const entries: CapabilityEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isBlockStart = trimmed.startsWith('/**');
    const isLineDoc = trimmed.startsWith('///');
    if (!isBlockStart && !isLineDoc) continue;

    const body: string[] = [];
    let j = i;
    if (isBlockStart) {
      while (j < lines.length) {
        body.push(cleanLine(lines[j]));
        if (lines[j].includes('*/')) { j++; break; }
        j++;
      }
    } else {
      while (j < lines.length && lines[j].trim().startsWith('///')) {
        body.push(cleanLine(lines[j]));
        j++;
      }
    }

    const joined = body.join('\n');
    /**
     * The value of an `@name` tag, including any continuation lines.
     *
     * The first cut read only the line carrying the tag and silently dropped
     * the rest, so a wrapped annotation lost everything after its first line.
     * That is not hypothetical: `@intent Replace fixed-duration sleeps in specs
     * with a predicate poll that / fails loudly, by name, on a genuine timeout`
     * rendered in CATALOG.md as "…with a predicate poll that" and stopped
     * mid-clause. Silent truncation into a GENERATED document that CLAUDE.md
     * tells every agent to trust as the discovery index is worse than a terse
     * entry, because a half-sentence reads as corruption and casts doubt on
     * every other row.
     *
     * A continuation is any following line that neither starts a new `@tag`
     * nor is blank, joined with a single space so the wrapping in the source
     * comment does not leak into the rendered output.
     */
    const tag = (name: string) => {
      const pattern = new RegExp(`@${name}\\s+(.+)`);
      const start = body.findIndex((l) => pattern.test(l));
      if (start === -1) return undefined;

      const parts = [body[start].match(pattern)![1].trim()];
      for (let k = start + 1; k < body.length; k++) {
        const line = body[k].trim();
        if (line === '' || line.startsWith('@')) break;
        parts.push(line);
      }
      return parts.join(' ').trim();
    };
    const xml = (name: string) =>
      joined.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];

    const capability = tag('capability') ?? xml('capability')?.trim();
    if (capability) {
      const intent = (tag('intent') ?? decodeXml(xml('intent')?.trim() ?? '')) || '';
      const reuse = (tag('reuse') ?? decodeXml(xml('reuse')?.trim() ?? '')) || '';
      const entry: CapabilityEntry = {
        capability,
        intent,
        reuse,
        file: filePath.replace(/\\/g, '/'),
        language,
        symbol: symbolFrom(lines, j),
      };
      entries.push(entry);
    }
    i = j - 1;
  }

  return entries;
}
