import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { routes } from './app.routes';
import { provideTransport } from './transport';

// The web build talks to the .NET API here; under Tauri the IPC wire is chosen
// instead and this base URL is unused. Point it at your API for the browser build.
const API_BASE_URL = 'http://localhost:5199';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr()),
    provideTransport(API_BASE_URL),
  ]
};
