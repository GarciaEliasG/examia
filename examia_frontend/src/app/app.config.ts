import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';


//Registramos nuevas configuraciones
//registramos el auth.interceptor de manera global asi todas las HTTP pasan por alli automaticamente
//Actualizamos el codigo con librerias mas actuales
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};