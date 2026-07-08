import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTE_PATHS } from '../constants/route-paths.constant';
import { AuthService } from '../services/auth.service';

/** Blocks access to protected routes (dashboard shell and its children) unless a session exists. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([ROUTE_PATHS.LOGIN], { queryParams: { returnUrl: state.url } });
};
