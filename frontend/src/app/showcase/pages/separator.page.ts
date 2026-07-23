import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Separator usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-separator` (or `[hlmSeparator]`) is a self-closing
 * directive with no projected content — `orientation` (default 'horizontal')
 * and `decorative` are its only inputs, both hosted from BrnSeparator.
 */
@Component({
  selector: 'app-separator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmSeparatorImports],
  template: `
    <app-component-page slug="separator">
      <app-usage
        title="Horizontal (default)"
        note="No orientation attribute needed — horizontal is the default."
        [code]="codeHorizontal"
      >
        <div class="flex max-w-sm flex-col gap-4 text-sm">
          <div class="flex flex-col gap-1.5">
            <div class="font-medium leading-none">spartan/ui</div>
            <div class="text-muted-foreground">An open-source UI component library.</div>
          </div>
          <hlm-separator />
          <div>A set of beautifully designed components you can customize, extend, and build on.</div>
        </div>
      </app-usage>

      <app-usage
        title="Vertical"
        note="orientation='vertical' needs a sized flex row to be visible — the separator itself has no height."
        [code]="codeVertical"
      >
        <div class="flex h-5 items-center gap-4 text-sm">
          <div>Blog</div>
          <hlm-separator orientation="vertical" />
          <div>Docs</div>
          <hlm-separator orientation="vertical" />
          <div>Source</div>
        </div>
      </app-usage>

      <app-usage
        title="Between list rows"
        note="Repeated horizontal separators, one per row boundary."
        [code]="codeList"
      >
        <div class="flex w-full max-w-sm flex-col gap-2 text-sm">
          <dl class="flex items-center justify-between">
            <dt>Plan</dt>
            <dd class="text-muted-foreground">Professional</dd>
          </dl>
          <hlm-separator />
          <dl class="flex items-center justify-between">
            <dt>Seats</dt>
            <dd class="text-muted-foreground">12</dd>
          </dl>
          <hlm-separator />
          <dl class="flex items-center justify-between">
            <dt>Renews</dt>
            <dd class="text-muted-foreground">Oct 4</dd>
          </dl>
        </div>
      </app-usage>

      <app-usage
        title="Composition: settings menu"
        note="Horizontal groups stacked, each pair of groups divided by a vertical separator — the layout a settings header would use."
        [code]="codeComposition"
      >
        <div class="flex items-center gap-4 text-sm">
          <div class="flex flex-col gap-1">
            <span class="font-medium">Settings</span>
            <span class="text-muted-foreground text-xs">Manage preferences</span>
          </div>
          <hlm-separator orientation="vertical" />
          <div class="flex flex-col gap-1">
            <span class="font-medium">Account</span>
            <span class="text-muted-foreground text-xs">Profile & security</span>
          </div>
          <hlm-separator orientation="vertical" />
          <div class="flex flex-col gap-1">
            <span class="font-medium">Help</span>
            <span class="text-muted-foreground text-xs">Support & docs</span>
          </div>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SeparatorPage {
  protected readonly codeHorizontal = `<div class="flex flex-col gap-1.5">
  <div class="font-medium leading-none">spartan/ui</div>
  <div class="text-muted-foreground">An open-source UI component library.</div>
</div>
<hlm-separator />
<div>A set of beautifully designed components you can customize, extend, and build on.</div>`;

  protected readonly codeVertical = `<div class="flex h-5 items-center gap-4 text-sm">
  <div>Blog</div>
  <hlm-separator orientation="vertical" />
  <div>Docs</div>
  <hlm-separator orientation="vertical" />
  <div>Source</div>
</div>`;

  protected readonly codeList = `<dl class="flex items-center justify-between">
  <dt>Plan</dt>
  <dd class="text-muted-foreground">Professional</dd>
</dl>
<hlm-separator />
<dl class="flex items-center justify-between">
  <dt>Seats</dt>
  <dd class="text-muted-foreground">12</dd>
</dl>`;

  protected readonly codeComposition = `<div class="flex items-center gap-4 text-sm">
  <div class="flex flex-col gap-1">
    <span class="font-medium">Settings</span>
    <span class="text-muted-foreground text-xs">Manage preferences</span>
  </div>
  <hlm-separator orientation="vertical" />
  <div class="flex flex-col gap-1">
    <span class="font-medium">Account</span>
    <span class="text-muted-foreground text-xs">Profile & security</span>
  </div>
</div>`;
}
