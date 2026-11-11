import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  passwordVisible = false;
  confirmPasswordVisible = false;
  message = '';
  registrationComplete = false;

  register(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const values = new FormData(form);
    const name = String(values.get('name') ?? '').trim();
    const email = String(values.get('email') ?? '').trim().toLowerCase();
    const password = String(values.get('password') ?? '');
    const confirmPassword = String(values.get('confirm-password') ?? '');

    if (password.length < 8) {
      this.message = 'La contraseña debe tener al menos 8 caracteres.';
      this.registrationComplete = false;
      return;
    }

    if (password !== confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      this.registrationComplete = false;
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('studynext.users') ?? '[]') as Array<{ email: string }>;
      if (users.some((user) => user.email === email)) {
        this.message = 'Ya existe una cuenta con ese correo.';
        this.registrationComplete = false;
        return;
      }

      localStorage.setItem('studynext.users', JSON.stringify([...users, { name, email, password }]));
      sessionStorage.setItem('studynext.currentUser', JSON.stringify({ name, email }));
      window.location.assign('/dashboard.html');
    } catch {
      this.message = 'No se pudo guardar la cuenta en este navegador. Inténtalo de nuevo.';
      this.registrationComplete = false;
    }
  }
}
