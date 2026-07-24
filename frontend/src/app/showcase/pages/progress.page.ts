import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Progress usages. HlmProgress and HlmProgressIndicator are Directives with no
 * template of their own — confirmed against the MCP docs and the vendored
 * source — so `<hlm-progress-indicator />` is a plain child, never a projected
 * slot that could be left empty.
 */
@Component({
  selector: 'app-progress-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmProgressImports, HlmButtonImports, HlmLabelImports],
  template: `
    <app-component-page slug="progress">
      <app-usage title="Value" note="A fixed determinate value." [code]="codeValue">
        <hlm-progress class="w-64" value="33">
          <hlm-progress-indicator />
        </hlm-progress>
      </app-usage>

      <app-usage
        title="Indeterminate"
        note="Omit value and the indicator animates instead of filling."
        [code]="codeIndeterminate"
      >
        <hlm-progress class="w-64">
          <hlm-progress-indicator />
        </hlm-progress>
      </app-usage>

      <app-usage
        title="Simulated download"
        note="A signal drives the value on an interval — a real ticking state, not a hand-set style."
        [code]="codeLive"
      >
        <div class="flex w-64 flex-col gap-2">
          <hlm-progress [value]="liveValue()">
            <hlm-progress-indicator />
          </hlm-progress>
          <button hlmBtn variant="outline" size="sm" class="self-start" (click)="startDownload()">
            {{ downloading() ? liveValue() + '%' : 'Start download' }}
          </button>
        </div>
      </app-usage>

      <app-usage title="With a label" note="Paired with hlmLabel above the bar." [code]="codeLabel">
        <div class="flex w-64 flex-col gap-2">
          <label hlmLabel>Uploading…</label>
          <hlm-progress [value]="60">
            <hlm-progress-indicator />
          </hlm-progress>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class ProgressPage {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly liveValue = signal(0);
  protected readonly downloading = signal(false);

  protected startDownload(): void {
    if (this.downloading()) return;
    this.downloading.set(true);
    this.liveValue.set(0);

    const id = setInterval(() => {
      const next = this.liveValue() + 20;
      if (next >= 100) {
        this.liveValue.set(100);
        this.downloading.set(false);
        clearInterval(id);
        return;
      }
      this.liveValue.set(next);
    }, 200);

    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  protected readonly codeValue = `<hlm-progress value="33">
  <hlm-progress-indicator />
</hlm-progress>`;

  protected readonly codeIndeterminate = `<!-- no value input -> indeterminate animation -->
<hlm-progress>
  <hlm-progress-indicator />
</hlm-progress>`;

  protected readonly codeLive = `liveValue = signal(0);

setInterval(() => liveValue.update((v) => Math.min(v + 20, 100)), 200);

<hlm-progress [value]="liveValue()">
  <hlm-progress-indicator />
</hlm-progress>`;

  protected readonly codeLabel = `<label hlmLabel>Uploading…</label>
<hlm-progress [value]="60">
  <hlm-progress-indicator />
</hlm-progress>`;
}
