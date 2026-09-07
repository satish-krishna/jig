import { Component } from '@angular/core';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Typography usages.
 *
 * Not part of the upstream spartan.ng catalog: `spartan_components_list`
 * returns no `typography` entry and `spartan_components_get('typography')`
 * comes back with zero code blocks — this component is vendored into
 * `frontend/libs/ui/typography` but has no public docs page to cross-check
 * against. Anatomy below is verified against the vendored source only: every
 * directive (`hlmH1`..`hlmH4`, `hlmP`, `hlmLead`, `hlmLarge`, `hlmSmall`,
 * `hlmMuted`, `hlmBlockquote`, `hlmCode`, `hlmUl`) is a plain attribute
 * directive with no host template and no projected slot — each one is just
 * the matching native element carrying the directive's classes.
 */
@Component({
  selector: 'app-typography-page',
  imports: [ComponentPage, Usage, HlmTypographyImports],
  template: `
    <app-component-page slug="typography">
      <app-usage title="Headings" note="hlmH1 through hlmH4, largest to smallest." [code]="codeHeadings">
        <div class="grid w-full gap-s">
          <h1 hlmH1>Heading one</h1>
          <h2 hlmH2>Heading two</h2>
          <h3 hlmH3>Heading three</h3>
          <h4 hlmH4>Heading four</h4>
        </div>
      </app-usage>

      <app-usage
        title="Body text"
        note="hlmLead for an intro line, hlmP for body copy, hlmLarge/hlmSmall/hlmMuted for emphasis."
        [code]="codeBody"
      >
        <div class="grid w-full gap-xs">
          <p hlmLead>A short lead paragraph introducing the section.</p>
          <p hlmP>Regular body text, the default reading size for prose.</p>
          <p hlmLarge>Larger, semibold text for emphasis.</p>
          <p hlmSmall>Small print for secondary detail.</p>
          <p hlmMuted>Muted text for de-emphasized captions.</p>
        </div>
      </app-usage>

      <app-usage
        title="Blockquote and code"
        note="hlmBlockquote for quoted text, hlmCode for inline code spans."
        [code]="codeQuote"
      >
        <div class="grid w-full gap-s">
          <blockquote hlmBlockquote>"Make it work, make it right, make it fast."</blockquote>
          <p hlmP>Run <code hlmCode>npm run verify</code> before every commit.</p>
        </div>
      </app-usage>

      <app-usage
        title="Article composition"
        note="Heading, lead, paragraph and list together, the realistic combination."
        [code]="codeArticle"
      >
        <article class="grid w-full gap-xs">
          <h2 hlmH2>Release notes</h2>
          <p hlmLead>What changed in this version.</p>
          <p hlmP>This release focuses on stability and a handful of small fixes.</p>
          <ul hlmUl>
            <li>Fixed a race condition in the transport layer.</li>
            <li>Improved keyboard navigation across dialogs.</li>
            <li>Updated dependencies to their latest patch versions.</li>
          </ul>
        </article>
      </app-usage>
    </app-component-page>
  `,
})
export class TypographyPage {
  protected readonly codeHeadings = `<h1 hlmH1>Heading one</h1>
<h2 hlmH2>Heading two</h2>
<h3 hlmH3>Heading three</h3>
<h4 hlmH4>Heading four</h4>`;

  protected readonly codeBody = `<p hlmLead>A short lead paragraph introducing the section.</p>
<p hlmP>Regular body text, the default reading size for prose.</p>
<p hlmLarge>Larger, semibold text for emphasis.</p>
<p hlmSmall>Small print for secondary detail.</p>
<p hlmMuted>Muted text for de-emphasized captions.</p>`;

  protected readonly codeQuote = `<blockquote hlmBlockquote>"Make it work, make it right, make it fast."</blockquote>
<p hlmP>Run <code hlmCode>npm run verify</code> before every commit.</p>`;

  protected readonly codeArticle = `<h2 hlmH2>Release notes</h2>
<p hlmLead>What changed in this version.</p>
<p hlmP>This release focuses on stability and a handful of small fixes.</p>
<ul hlmUl>
  <li>Fixed a race condition in the transport layer.</li>
  <li>Improved keyboard navigation across dialogs.</li>
</ul>`;
}
