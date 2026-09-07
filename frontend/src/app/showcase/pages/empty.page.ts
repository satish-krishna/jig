import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderCode, lucideRefreshCcw } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Empty usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmEmpty` and every part (`hlm-empty-header`,
 * `hlm-empty-media`, `hlmEmptyTitle`, `hlmEmptyDescription`,
 * `hlm-empty-content`) are plain attribute directives with no host
 * template — there is no projected slot, so an empty state is just nested
 * elements carrying the directives' classes.
 */
@Component({
  selector: 'app-empty-page',
  imports: [ComponentPage, Usage, HlmEmptyImports, HlmButtonImports, HlmAvatarImports, NgIcon],
  providers: [provideIcons({ lucideFolderCode, lucideRefreshCcw })],
  template: `
    <app-component-page slug="empty">
      <app-usage
        title="Basic"
        note="Icon media, title, description and a pair of actions is the common shape."
        [code]="codeBasic"
      >
        <hlm-empty class="w-full max-w-md">
          <hlm-empty-header>
            <hlm-empty-media variant="icon">
              <ng-icon name="lucideFolderCode" />
            </hlm-empty-media>
            <div hlmEmptyTitle>No projects yet</div>
            <div hlmEmptyDescription>Get started by creating your first project.</div>
          </hlm-empty-header>
          <hlm-empty-content class="flex-row justify-center gap-s">
            <button hlmBtn>Create project</button>
            <button hlmBtn variant="outline">Import project</button>
          </hlm-empty-content>
        </hlm-empty>
      </app-usage>

      <app-usage
        title="Outline"
        note="hlmEmpty works as a plain attribute on a div too, styled here with an explicit dashed border."
        [code]="codeOutline"
      >
        <div hlmEmpty class="w-full max-w-md border border-dashed">
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <ng-icon name="lucideFolderCode" />
            </div>
            <div hlmEmptyTitle>Cloud storage empty</div>
            <div hlmEmptyDescription>Upload files to access them anywhere.</div>
          </div>
          <div hlmEmptyContent>
            <button hlmBtn variant="outline">Upload files</button>
          </div>
        </div>
      </app-usage>

      <app-usage
        title="With avatar"
        note="hlm-empty-media accepts any content, including a full hlm-avatar with its own fallback slot."
        [code]="codeAvatar"
      >
        <hlm-empty class="w-full max-w-md">
          <hlm-empty-header>
            <hlm-empty-media>
              <hlm-avatar class="size-12">
                <span hlmAvatarFallback>RG</span>
              </hlm-avatar>
            </hlm-empty-media>
            <div hlmEmptyTitle>User offline</div>
            <div hlmEmptyDescription>Leave a message and they'll get back to you.</div>
          </hlm-empty-header>
          <hlm-empty-content>
            <button hlmBtn size="sm">Leave message</button>
          </hlm-empty-content>
        </hlm-empty>
      </app-usage>

      <app-usage
        title="Retry with real state"
        note="The description reflects a real attempts signal; each click increments it — nothing is hand-typed."
        [code]="codeRetry"
      >
        <hlm-empty class="w-full max-w-md">
          <hlm-empty-header>
            <hlm-empty-media variant="icon">
              <ng-icon name="lucideRefreshCcw" />
            </hlm-empty-media>
            <div hlmEmptyTitle>Couldn't load data</div>
            <div hlmEmptyDescription>
              @if (attempts() === 0) {
                Something went wrong while loading this page.
              } @else {
                Still failing after {{ attempts() }} {{ attempts() === 1 ? 'retry' : 'retries' }}.
              }
            </div>
          </hlm-empty-header>
          <hlm-empty-content>
            <button hlmBtn variant="outline" (click)="retry()">
              <ng-icon name="lucideRefreshCcw" />
              Retry
            </button>
          </hlm-empty-content>
        </hlm-empty>
      </app-usage>
    </app-component-page>
  `,
})
export class EmptyPage {
  protected readonly attempts = signal(0);

  protected retry(): void {
    this.attempts.update((n) => n + 1);
  }

  protected readonly codeBasic = `<hlm-empty>
  <hlm-empty-header>
    <hlm-empty-media variant="icon">
      <ng-icon name="lucideFolderCode" />
    </hlm-empty-media>
    <div hlmEmptyTitle>No projects yet</div>
    <div hlmEmptyDescription>Get started by creating your first project.</div>
  </hlm-empty-header>
  <hlm-empty-content class="flex-row justify-center gap-s">
    <button hlmBtn>Create project</button>
    <button hlmBtn variant="outline">Import project</button>
  </hlm-empty-content>
</hlm-empty>`;

  protected readonly codeOutline = `<div hlmEmpty class="border border-dashed">
  <div hlmEmptyHeader>
    <div hlmEmptyMedia variant="icon"><ng-icon name="lucideFolderCode" /></div>
    <div hlmEmptyTitle>Cloud storage empty</div>
    <div hlmEmptyDescription>Upload files to access them anywhere.</div>
  </div>
  <div hlmEmptyContent>
    <button hlmBtn variant="outline">Upload files</button>
  </div>
</div>`;

  protected readonly codeAvatar = `<hlm-empty>
  <hlm-empty-header>
    <hlm-empty-media>
      <hlm-avatar class="size-12">
        <span hlmAvatarFallback>RG</span>
      </hlm-avatar>
    </hlm-empty-media>
    <div hlmEmptyTitle>User offline</div>
    <div hlmEmptyDescription>Leave a message and they'll get back to you.</div>
  </hlm-empty-header>
  <hlm-empty-content>
    <button hlmBtn size="sm">Leave message</button>
  </hlm-empty-content>
</hlm-empty>`;

  protected readonly codeRetry = `// attempts is a real signal; each click increments it.
attempts = signal(0);
retry() { this.attempts.update((n) => n + 1); }

<div hlmEmptyDescription>
  @if (attempts() === 0) {
    Something went wrong while loading this page.
  } @else {
    Still failing after {{ attempts() }} {{ attempts() === 1 ? 'retry' : 'retries' }}.
  }
</div>
<button hlmBtn variant="outline" (click)="retry()">Retry</button>`;
}
