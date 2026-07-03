import '@analogjs/vitest-angular/setup-zone';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Reset before init so setup is idempotent. Under CI's shared worker context the
// Angular TestBed singleton can persist across spec files, so a second
// initTestEnvironment throws "Cannot set base providers because it has already been
// called". resetTestEnvironment is a safe no-op on the first run.
const testBed = getTestBed();
testBed.resetTestEnvironment();
testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
