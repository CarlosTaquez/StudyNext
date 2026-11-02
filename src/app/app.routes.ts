import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { Splash } from './pages/auth/splash/splash';
import { Recovery } from './pages/auth/recovery/recovery';
import { Profile } from './pages/auth/profile/profile';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'splash' },
  { path: 'splash', component: Splash },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: 'recuperar', component: Recovery },
  { path: 'perfil', component: Profile },
  { path: '**', redirectTo: 'splash' },
];
