import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentPage } from '../component-page';
import { COMPONENTS } from '../component-registry';

/**
 * Stands in for a component whose usages have not been written yet.
 *
 * It still renders the generated API table and the upstream docs link, so the
 * page is useful rather than empty — and it says plainly that the usages are
 * missing instead of implying the component is undocumented upstream.
 */
@Component({
  selector: 'app-undocumented-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage],
  template: `
    <app-component-page [slug]="slug()">
      <div class="border-border rounded-lg border border-dashed px-4 py-6">
        <p class="text-sm font-medium">Usages not written yet.</p>
        <p class="text-muted-foreground mt-1 text-sm">
          The API below is generated from the vendored source and is accurate. Worked examples for
          this component are still to come — until then, follow the upstream reference rather than
          guessing at the composition.
        </p>
      </div>
    </app-component-page>
  `,
})
export class UndocumentedPage {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly slug = computed(() => {
    const slug = this.params()?.get('slug') ?? '';
    return COMPONENTS.some((c) => c.slug === slug) ? slug : '';
  });
}
