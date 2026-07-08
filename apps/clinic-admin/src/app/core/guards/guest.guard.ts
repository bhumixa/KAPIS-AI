import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTE_PATHS } from '../constants/route-paths.constant';
import { AuthService } from '../services/auth.service';

/** Keeps an already-authenticated user from seeing the login screen again. */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.createUrlTree([ROUTE_PATHS.DASHBOARD]) : true;
};
