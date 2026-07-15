import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTE_PATHS } from '../constants/route-paths.constant';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Blocks access to routes unless the current user's role is one of
 * `allowedRoles`. Runs after `authGuard` (which already guarantees a
 * session exists), so an unauthenticated hit here is impossible in
 * practice - the fallback still redirects to the dashboard rather than
 * assuming a non-null user.
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.currentUser()?.role;

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree([ROUTE_PATHS.DASHBOARD]);
  };
}
