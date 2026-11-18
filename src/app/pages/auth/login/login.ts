import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  passwordVisible = false;
  message = signal('');
  isLoading = signal(false);

  async login(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const values = new FormData(form);
    const email = String(values.get('email') ?? '').trim().toLowerCase();
    const password = String(values.get('password') ?? '');

    const remember = values.get('remember') === 'on';
    this.message.set('');
    this.isLoading.set(true);
    try {
      await this.authService.login(email, password, remember);
      window.location.assign('/dashboard.html');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        this.message.set('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (code === 'auth/invalid-email') {
        this.message.set('El correo electrónico no es válido.');
      } else if (code === 'auth/network-request-failed') {
        this.message.set('No hay conexión. Revisa Internet e inténtalo de nuevo.');
      } else if (code === 'auth/too-many-requests') {
        this.message.set('Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.');
      } else {
        this.message.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
