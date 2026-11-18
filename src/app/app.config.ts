import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyA2gzCIEYOEbRKMOrxdkAczihVR3uw9Eyk',
        authDomain: 'studynext-1b59f.firebaseapp.com',
        projectId: 'studynext-1b59f',
        storageBucket: 'studynext-1b59f.firebasestorage.app',
        messagingSenderId: '417354391343',
        appId: '1:417354391343:web:92176151d2f97d5665cbda',
        measurementId: 'G-RJZTB4JTK4',
      }),
    ),
    provideAuth(() => getAuth()),
  ],
};
