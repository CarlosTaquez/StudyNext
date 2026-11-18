import { Injectable, inject } from '@angular/core';
import {
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  async register(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return credential.user;
  }

  async login(email: string, password: string, remember: boolean) {
    await setPersistence(
      this.auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    return signInWithEmailAndPassword(this.auth, email, password);
  }
}
