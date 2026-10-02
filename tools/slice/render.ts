// The slice generator's template renderer. Every emitted file's text lives in an EJS template
// under tools/slice/templates/; the decisions that fill it are made in TypeScript and handed
// over as a model. This file is the only place EJS is configured, so the rules the templates
// rely on are enforced here rather than remembered: output is raw (<%= would HTML-escape the
// angle brackets and ampersands every target language is full of), a model key the template
// misspells throws instead of rendering "undefined", and a template saved with CRLF still
// renders LF.

import ejs from 'ejs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), 'templates');

/**
 * Wrap a model so reading a key it does not have throws, naming the key. Nested objects and
 * arrays are wrapped as they are read, so `f.nmae` inside a loop fails the same way. A key
 * that exists with a null value is fine: templates test optional blocks with `if (m.x)`.
 */
export function strict<T extends object>(value: T, path = 'm'): T {
  return new Proxy(value, {
    get(target, key, receiver) {
      if (typeof key === 'symbol' || key in target) {
        const found = Reflect.get(target, key, receiver);
        return found !== null && typeof found === 'object' ? strict(found, `${path}.${String(key)}`) : found;
      }
      throw new Error(`template read ${path}.${String(key)}, which the model does not have`);
    },
  });
}

/** Render template source against a model. `name` only labels errors. */
export function renderSource(source: string, model: object, name = '<inline>'): string {
  if (source.includes('<%=')) {
    throw new Error(`${name}: use <%- (raw output), never <%= — it HTML-escapes the generated code`);
  }
  // Always the three-argument form: with only two, EJS copies options off the data object,
  // which would read keys the strict model does not have.
  return ejs.render(source.replace(/\r\n/g, '\n'), strict(model), {
    localsName: 'm',
    strict: true,
    _with: false,
    unsafePrototypeLocals: true,
  } as ejs.Options & { unsafePrototypeLocals: boolean }) as string;
}

/**
 * Render `tools/slice/templates/<name>` against a model.
 * @capability tools.slice.render-template
 * @intent Render EJS templates for slice generation with strict model validation
 * @reuse Used by every emitter (emit-*.ts) to render the final output
 */
export function renderTemplate(name: string, model: object): string {
  let source: string;
  try {
    source = readFileSync(join(TEMPLATES, name), 'utf8');
  } catch {
    throw new Error(`slice template not found: ${name} (looked in ${TEMPLATES})`);
  }
  return renderSource(source, model, name);
}
