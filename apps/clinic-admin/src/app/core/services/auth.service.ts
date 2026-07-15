import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { AuthResult, LoginCredentials } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Sprint 1 has no backend, so login is simulated: any non-empty
 * email/password pair "succeeds" and produces a fake token + user. The
 * public API (`login`/`logout`/`isAuthenticated`) is shaped exactly like a
 * real JWT-backed service so swapping in an HTTP call later doesn't ripple
 * into guards, interceptors, or components. Role is derived from the
 * email's local part so every role (including the "developer" role gating
 * Integrations) can be exercised without a real backend - e.g.
 * developer@anything logs in with the developer role, everything else
 * defaults to admin.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly _currentUser = signal<User | null>(this.tokenStorage.getUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(credentials: LoginCredentials): Observable<AuthResult> {
    const localPart = credentials.email.split('@')[0];
    const role: UserRole = localPart.toLowerCase() === 'developer' ? 'developer' : 'admin';

    const user: User = {
      id: 'dummy-user-1',
      name: localPart,
      email: credentials.email,
      role,
    };
    const result: AuthResult = {
      token: `dummy.${btoa(credentials.email)}.token`,
      user,
    };

    return of(result).pipe(
      delay(400),
      tap(({ token, user: authUser }) => {
        this.tokenStorage.setToken(token);
        this.tokenStorage.setUser(authUser);
        this._currentUser.set(authUser);
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this._currentUser.set(null);
  }
}
