import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { appConfig } from './app.config';

describe('appConfig', () => {
  // Angular 21 made CDK overlays render inside popovers by default, which puts
  // every helm overlay (dialog, sheet, tooltip) above position:fixed chrome such
  // as the shell sidebar. provideSpartanHlm() turns that off; without it the
  // first overlay we add renders in the wrong stacking context.
  it('opts the CDK overlay out of popover rendering', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    expect(TestBed.inject(OVERLAY_DEFAULT_CONFIG, null)).toEqual({ usePopover: false });
  });
});
