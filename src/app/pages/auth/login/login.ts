import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  passwordVisible = false;
  message = '';

  login(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const values = new FormData(form);
    const email = String(values.get('email') ?? '').trim().toLowerCase();
    const password = String(values.get('password') ?? '');

    try {
      const users = JSON.parse(localStorage.getItem('studynext.users') ?? '[]') as Array<{
        name: string;
        email: string;
        password: string;
      }>;
      const user = users.find((account) => account.email === email && account.password === password);

      if (!user) {
        this.message = 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.';
        return;
      }

      sessionStorage.setItem('studynext.currentUser', JSON.stringify({ name: user.name, email: user.email }));
      window.location.assign('/dashboard.html');
    } catch {
      this.message = 'No se pudieron leer las cuentas guardadas en este navegador.';
    }
  }
}
