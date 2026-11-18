import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  errorMessage = '';

  register(form: HTMLFormElement): void {
    const values = new FormData(form);
    const name = String(values.get('name') ?? '').trim();
    const email = String(values.get('email') ?? '').trim();
    const password = String(values.get('password') ?? '');
    const confirmPassword = String(values.get('confirm-password') ?? '');
    const acceptedTerms = values.get('terms') === 'on';

    if (!name || !email || !password || !confirmPassword) {
      this.errorMessage = 'Completa todos los campos para continuar.';
      return;
    }
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    if (!acceptedTerms) {
      this.errorMessage = 'Debes aceptar los términos para continuar.';
      return;
    }

    // Guardamos solo los datos visibles del perfil; la contraseña no se almacena.
    localStorage.setItem('studynext.profile.v1', JSON.stringify({ name, email }));
    window.location.href = '/dashboard.html';
  }
}
