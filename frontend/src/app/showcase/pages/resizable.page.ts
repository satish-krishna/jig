import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmResizableImports } from '@spartan-ng/helm/resizable';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Resizable usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-resizable-group` > (`hlm-resizable-panel` +
 * `hlm-resizable-handle`)* — panels and handles are plain siblings, no
 * projected slot. Panels need explicit `defaultSize` values (percentages
 * summing to 100 within a group) or the initial split is arbitrary.
 */
@Component({
  selector: 'app-resizable-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmResizableImports, HlmButtonImports],
  template: `
    <app-component-page slug="resizable">
      <app-usage title="Default, two panels" note="Drag the handle to resize either side." [code]="codeDefault">
        <hlm-resizable-group class="h-40 w-full max-w-sm rounded-lg border">
          <hlm-resizable-panel defaultSize="50">
            <div class="flex h-full items-center justify-center p-xl">
              <span class="font-semibold">One</span>
            </div>
          </hlm-resizable-panel>
          <hlm-resizable-handle withHandle />
          <hlm-resizable-panel defaultSize="50">
            <div class="flex h-full items-center justify-center p-xl">
              <span class="font-semibold">Two</span>
            </div>
          </hlm-resizable-panel>
        </hlm-resizable-group>
      </app-usage>

      <app-usage
        title="Vertical direction"
        note="direction='vertical' stacks panels top to bottom instead of side by side."
        [code]="codeVertical"
      >
        <hlm-resizable-group class="h-56 w-full max-w-sm rounded-lg border" direction="vertical">
          <hlm-resizable-panel defaultSize="30">
            <div class="flex h-full items-center justify-center p-xl">
              <span class="font-semibold">Header</span>
            </div>
          </hlm-resizable-panel>
          <hlm-resizable-handle withHandle />
          <hlm-resizable-panel defaultSize="70">
            <div class="flex h-full items-center justify-center p-xl">
              <span class="font-semibold">Content</span>
            </div>
          </hlm-resizable-panel>
        </hlm-resizable-group>
      </app-usage>

      <app-usage
        title="Nested groups"
        note="A vertical group sits inside one panel of a horizontal group — the composition every split-pane layout needs."
        [code]="codeNested"
      >
        <hlm-resizable-group class="h-56 w-full max-w-sm rounded-lg border">
          <hlm-resizable-panel defaultSize="50">
            <div class="flex h-full items-center justify-center p-xl">
              <span class="font-semibold">Sidebar</span>
            </div>
          </hlm-resizable-panel>
          <hlm-resizable-handle withHandle />
          <hlm-resizable-panel defaultSize="50">
            <hlm-resizable-group direction="vertical">
              <hlm-resizable-panel defaultSize="50">
                <div class="flex h-full items-center justify-center p-xl">
                  <span class="font-semibold">Preview</span>
                </div>
              </hlm-resizable-panel>
              <hlm-resizable-handle withHandle />
              <hlm-resizable-panel defaultSize="50">
                <div class="flex h-full items-center justify-center p-xl">
                  <span class="font-semibold">Console</span>
                </div>
              </hlm-resizable-panel>
            </hlm-resizable-group>
          </hlm-resizable-panel>
        </hlm-resizable-group>
      </app-usage>

      <app-usage
        title="Controlled layout, real signal state"
        note="layout/layoutChange are wired to a signal — the reset button writes to it directly, the drag handle writes back."
        [code]="codeControlled"
      >
        <div class="flex w-full max-w-sm flex-col gap-s">
          <button hlmBtn variant="outline" size="sm" class="self-start" (click)="resetLayout()">
            Reset to 40 / 60
          </button>
          <hlm-resizable-group class="h-40 rounded-lg border" [(layout)]="layout">
            <hlm-resizable-panel defaultSize="40">
              <div class="flex h-full items-center justify-center p-xl">
                <span class="font-semibold">One</span>
              </div>
            </hlm-resizable-panel>
            <hlm-resizable-handle withHandle />
            <hlm-resizable-panel defaultSize="60">
              <div class="flex h-full items-center justify-center p-xl">
                <span class="font-semibold">Two</span>
              </div>
            </hlm-resizable-panel>
          </hlm-resizable-group>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class ResizablePage {
  /** Two-way bound to hlm-resizable-group's layout model — a real signal, not a hand-set style. */
  protected readonly layout = signal([40, 60]);

  protected resetLayout(): void {
    this.layout.set([40, 60]);
  }

  protected readonly codeDefault = `<hlm-resizable-group class="h-40 rounded-lg border">
  <hlm-resizable-panel defaultSize="50">
    <div class="flex h-full items-center justify-center p-xl">One</div>
  </hlm-resizable-panel>
  <hlm-resizable-handle withHandle />
  <hlm-resizable-panel defaultSize="50">
    <div class="flex h-full items-center justify-center p-xl">Two</div>
  </hlm-resizable-panel>
</hlm-resizable-group>`;

  protected readonly codeVertical = `<hlm-resizable-group class="h-56 rounded-lg border" direction="vertical">
  <hlm-resizable-panel defaultSize="30">
    <div class="flex h-full items-center justify-center p-xl">Header</div>
  </hlm-resizable-panel>
  <hlm-resizable-handle withHandle />
  <hlm-resizable-panel defaultSize="70">
    <div class="flex h-full items-center justify-center p-xl">Content</div>
  </hlm-resizable-panel>
</hlm-resizable-group>`;

  protected readonly codeNested = `<hlm-resizable-group class="h-56 rounded-lg border">
  <hlm-resizable-panel defaultSize="50">
    <div class="flex h-full items-center justify-center p-xl">Sidebar</div>
  </hlm-resizable-panel>
  <hlm-resizable-handle withHandle />
  <hlm-resizable-panel defaultSize="50">
    <hlm-resizable-group direction="vertical">
      <hlm-resizable-panel defaultSize="50">
        <div class="flex h-full items-center justify-center p-xl">Preview</div>
      </hlm-resizable-panel>
      <hlm-resizable-handle withHandle />
      <hlm-resizable-panel defaultSize="50">
        <div class="flex h-full items-center justify-center p-xl">Console</div>
      </hlm-resizable-panel>
    </hlm-resizable-group>
  </hlm-resizable-panel>
</hlm-resizable-group>`;

  protected readonly codeControlled = `layout = signal([40, 60]);
resetLayout() { this.layout.set([40, 60]); }

<button hlmBtn variant="outline" size="sm" (click)="resetLayout()">Reset to 40 / 60</button>
<hlm-resizable-group class="h-40 rounded-lg border" [(layout)]="layout">
  <hlm-resizable-panel defaultSize="40">
    <div class="flex h-full items-center justify-center p-xl">One</div>
  </hlm-resizable-panel>
  <hlm-resizable-handle withHandle />
  <hlm-resizable-panel defaultSize="60">
    <div class="flex h-full items-center justify-center p-xl">Two</div>
  </hlm-resizable-panel>
</hlm-resizable-group>`;
}
