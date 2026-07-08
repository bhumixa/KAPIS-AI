import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';
import { User } from '../models/user.model';

/**
 * Thin wrapper around `localStorage`. Isolating storage access here means the
 * real JWT integration (Sprint 2+) only has to change this one file - callers
 * (AuthService, guards, interceptors) never touch `window.localStorage` directly.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}
