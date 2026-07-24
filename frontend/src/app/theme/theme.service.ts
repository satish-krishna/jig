import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'jig.theme';

const isMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

/**
 * Light/dark mode for the whole app. The only thing it does is put (or remove)
 * the `dark` class on the document root: `styles.css` declares the OKLCH tokens
 * under `:root` and `:root.dark`, and the spartan preset declares
 * `@custom-variant dark (&:is(.dark *))`, so every `dark:` utility in libs/ui
 * keys off that one class.
 *
 * Deliberately does NOT attempt to switch spartan *styles* (nova, vega, ...).
 * Those files carry no CSS variables — they are `@apply` utilities the CLI
 * inlines into libs/ui at generation time (nova `h-8` vs vega `h-9`), so a
 * compiled component cannot be restyled at runtime. Style is a build-time
 * choice; see ADR 0010.
 *
 * @capability ui.theme-mode
 * @intent Switch the app between light and dark, remembering the choice.
 * @reuse Inject it and call toggle(), or bind to mode(). Applied globally from the shell header.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _mode = signal<ThemeMode>(this.initial());

  /** The active mode. Reading this in a template tracks changes. */
  readonly mode = this._mode.asReadonly();

  constructor() {
    // Applied directly rather than through an effect: an effect would defer the
    // class to the next change-detection tick, so the app would paint one frame
    // in the wrong theme on load.
    this.apply(this._mode());
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
    this.apply(mode);
  }

  toggle(): void {
    this.set(this._mode() === 'dark' ? 'light' : 'dark');
  }

  private initial(): ThemeMode {
    const stored = this.read();
    if (isMode(stored)) return stored;

    // No stored choice: follow the OS until the user expresses one. matchMedia
    // is absent under SSR and in some test DOMs, so it is feature-detected
    // rather than assumed — light is the safe default.
    const view = this.document.defaultView;
    if (typeof view?.matchMedia !== 'function') return 'light';
    return view.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private apply(mode: ThemeMode): void {
    this.document.documentElement.classList.toggle('dark', mode === 'dark');
    this.write(mode);
  }

  // Storage is best-effort: private browsing and blocked storage must not take
  // the app down over a colour preference.
  private read(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private write(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }
}
