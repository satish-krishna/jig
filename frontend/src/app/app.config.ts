import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucidePlus,
  lucidePanelLeft,
  lucideComponent,
  lucideSun,
  lucideMoon,
} from '@ng-icons/lucide';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

import { routes } from './app.routes';
import { provideTransport } from './transport';
import { provideUsersMenu } from './features/users/users.commands';
import { provideShowcaseMenu } from './showcase/showcase.commands';

// The web build talks to the .NET API here; under Tauri the IPC wire is chosen
// instead and this base URL is unused. Point it at your API for the browser build.
const API_BASE_URL = 'http://localhost:5025';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr()),
    provideSpartanHlm(),
    provideTransport(API_BASE_URL),
    provideIcons({
      lucideUsers,
      lucidePlus,
      lucidePanelLeft,
      lucideComponent,
      lucideSun,
      lucideMoon,
    }),
    provideUsersMenu(),
    provideShowcaseMenu(),
  ]
};
