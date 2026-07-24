import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBold, lucideItalic, lucideUnderline } from '@ng-icons/lucide';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Toggle group usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmToggleGroup` is an attribute/element directive
 * (`[hlmToggleGroup],hlm-toggle-group`) whose children are plain
 * `button[hlmToggleGroupItem]` — there is no projected slot, the group is
 * just a flex container that coordinates its items through an injected token.
 */
@Component({
  selector: 'app-toggle-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmToggleGroupImports, HlmFieldImports, NgIcon],
  providers: [provideIcons({ lucideBold, lucideItalic, lucideUnderline })],
  template: `
    <app-component-page slug="toggle-group">
      <app-usage
        title="Single vs. multiple"
        note="type=single is exclusive; type=multiple lets several items stay pressed. Both bound with [(value)]."
        [code]="codeTypes"
      >
        <div class="flex flex-wrap items-start gap-6">
          <hlm-toggle-group type="single" variant="outline" [(value)]="view">
            <button hlmToggleGroupItem value="list" aria-label="Toggle list view">List</button>
            <button hlmToggleGroupItem value="grid" aria-label="Toggle grid view">Grid</button>
            <button hlmToggleGroupItem value="cards" aria-label="Toggle cards view">Cards</button>
          </hlm-toggle-group>
          <hlm-toggle-group type="multiple" variant="outline" [(value)]="formatting">
            <button hlmToggleGroupItem value="bold" aria-label="Toggle bold">
              <ng-icon name="lucideBold" />
            </button>
            <button hlmToggleGroupItem value="italic" aria-label="Toggle italic">
              <ng-icon name="lucideItalic" />
            </button>
            <button hlmToggleGroupItem value="underline" aria-label="Toggle underline">
              <ng-icon name="lucideUnderline" />
            </button>
          </hlm-toggle-group>
        </div>
      </app-usage>

      <app-usage title="Sizes" note="sm and default, both outline, single selection." [code]="codeSizes">
        <div class="flex flex-col items-start gap-4">
          <hlm-toggle-group type="single" size="sm" variant="outline" value="top">
            <button hlmToggleGroupItem value="top" aria-label="Toggle top">Top</button>
            <button hlmToggleGroupItem value="bottom" aria-label="Toggle bottom">Bottom</button>
          </hlm-toggle-group>
          <hlm-toggle-group type="single" variant="outline" value="top">
            <button hlmToggleGroupItem value="top" aria-label="Toggle top">Top</button>
            <button hlmToggleGroupItem value="bottom" aria-label="Toggle bottom">Bottom</button>
          </hlm-toggle-group>
        </div>
      </app-usage>

      <app-usage title="Disabled" note="disabled on the group reaches every item." [code]="codeDisabled">
        <hlm-toggle-group type="multiple" variant="outline" disabled>
          <button hlmToggleGroupItem value="bold" aria-label="Toggle bold">
            <ng-icon name="lucideBold" />
          </button>
          <button hlmToggleGroupItem value="italic" aria-label="Toggle italic">
            <ng-icon name="lucideItalic" />
          </button>
          <button hlmToggleGroupItem value="underline" aria-label="Toggle underline">
            <ng-icon name="lucideUnderline" />
          </button>
        </hlm-toggle-group>
      </app-usage>

      <app-usage
        title="In a field"
        note="The description text is read straight off the group's own value signal — no duplicated state."
        [code]="codeField"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel>Font weight</label>
          <hlm-toggle-group type="single" variant="outline" [(value)]="fontWeight">
            <button hlmToggleGroupItem value="normal" aria-label="Normal weight">Normal</button>
            <button hlmToggleGroupItem value="medium" aria-label="Medium weight">Medium</button>
            <button hlmToggleGroupItem value="bold" aria-label="Bold weight">Bold</button>
          </hlm-toggle-group>
          <p hlmFieldDescription>Buttons use font-{{ fontWeight() }}.</p>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class ToggleGroupPage {
  protected readonly view = signal('list');
  protected readonly formatting = signal<string[]>(['bold']);
  /** Real group state, read back out in the field's description below. */
  protected readonly fontWeight = signal('normal');

  protected readonly codeTypes = `<hlm-toggle-group type="single" variant="outline" [(value)]="view">
  <button hlmToggleGroupItem value="list" aria-label="Toggle list view">List</button>
  <button hlmToggleGroupItem value="grid" aria-label="Toggle grid view">Grid</button>
  <button hlmToggleGroupItem value="cards" aria-label="Toggle cards view">Cards</button>
</hlm-toggle-group>
<hlm-toggle-group type="multiple" variant="outline" [(value)]="formatting">
  <button hlmToggleGroupItem value="bold" aria-label="Toggle bold"><ng-icon name="lucideBold" /></button>
  <button hlmToggleGroupItem value="italic" aria-label="Toggle italic"><ng-icon name="lucideItalic" /></button>
  <button hlmToggleGroupItem value="underline" aria-label="Toggle underline"><ng-icon name="lucideUnderline" /></button>
</hlm-toggle-group>`;

  protected readonly codeSizes = `<hlm-toggle-group type="single" size="sm" variant="outline" value="top">
  <button hlmToggleGroupItem value="top" aria-label="Toggle top">Top</button>
  <button hlmToggleGroupItem value="bottom" aria-label="Toggle bottom">Bottom</button>
</hlm-toggle-group>`;

  protected readonly codeDisabled = `<hlm-toggle-group type="multiple" variant="outline" disabled>
  <button hlmToggleGroupItem value="bold" aria-label="Toggle bold"><ng-icon name="lucideBold" /></button>
  <button hlmToggleGroupItem value="italic" aria-label="Toggle italic"><ng-icon name="lucideItalic" /></button>
  <button hlmToggleGroupItem value="underline" aria-label="Toggle underline"><ng-icon name="lucideUnderline" /></button>
</hlm-toggle-group>`;

  protected readonly codeField = `<hlm-field>
  <label hlmFieldLabel>Font weight</label>
  <hlm-toggle-group type="single" variant="outline" [(value)]="fontWeight">
    <button hlmToggleGroupItem value="normal" aria-label="Normal weight">Normal</button>
    <button hlmToggleGroupItem value="medium" aria-label="Medium weight">Medium</button>
    <button hlmToggleGroupItem value="bold" aria-label="Bold weight">Bold</button>
  </hlm-toggle-group>
  <p hlmFieldDescription>Buttons use font-{{ fontWeight() }}.</p>
</hlm-field>`;
}
