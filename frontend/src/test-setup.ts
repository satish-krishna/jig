import '@analogjs/vitest-angular/setup-zone';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { beforeEach } from 'vitest';

// CI runs the specs non-isolated (one shared module context), so Angular's TestBed
// singleton bleeds across spec files. Two guards make setup survive that:
//  1. resetTestEnvironment before init, so a second initTestEnvironment does not
//     throw "Cannot set base providers because it has already been called" (a safe
//     no-op on the first run).
//  2. resetTestingModule before every test, so a prior file cannot leave an
//     instantiated TestBed behind and make configureTestingModule throw "already
//     instantiated". Angular's automatic per-test reset relies on file isolation,
//     which CI does not provide.
const testBed = getTestBed();
testBed.resetTestEnvironment();
testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
beforeEach(() => testBed.resetTestingModule());
