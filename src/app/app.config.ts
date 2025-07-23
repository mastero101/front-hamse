import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEsMX from '@angular/common/locales/es-MX';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeEsMX, 'es-MX');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    MatSnackBarModule,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};
