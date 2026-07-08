import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROUTE_PATHS } from '../constants/route-paths.constant';
import { AuthService } from '../services/auth.service';

/** Centralized HTTP error handling: an expired/invalid session forces a re-login. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate([ROUTE_PATHS.LOGIN]);
      }
      return throwError(() => error);
    }),
  );
};
