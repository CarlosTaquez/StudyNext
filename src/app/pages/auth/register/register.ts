import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly authService = inject(AuthService);
  passwordVisible = false;
  confirmPasswordVisible = false;
  message = signal('');
  registrationComplete = signal(false);
  isLoading = signal(false);

  async register(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const values = new FormData(form);
    const name = String(values.get('name') ?? '').trim();
    const email = String(values.get('email') ?? '').trim().toLowerCase();
    const password = String(values.get('password') ?? '');
    const confirmPassword = String(values.get('confirm-password') ?? '');

    if (password.length < 8) {
      this.message.set('La contraseña debe tener al menos 8 caracteres.');
      this.registrationComplete.set(false);
      return;
    }

    if (password !== confirmPassword) {
      this.message.set('Las contraseñas no coinciden.');
      this.registrationComplete.set(false);
      return;
    }

    this.message.set('');
    this.isLoading.set(true);
    try {
      await this.authService.register(name, email, password);
      localStorage.setItem('studynext.profile.v1', JSON.stringify({ name, email }));
      this.registrationComplete.set(true);
      window.location.assign('/dashboard.html');
    } catch (error: unknown) {
      this.registrationComplete.set(false);
      this.message.set(this.authErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private authErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese correo.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
      case 'auth/network-request-failed':
        return 'No hay conexión. Revisa Internet e inténtalo de nuevo.';
      case 'auth/operation-not-allowed':
        return 'El registro por correo y contraseña no está habilitado en Firebase.';
      default:
        return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
    }
  }
}
