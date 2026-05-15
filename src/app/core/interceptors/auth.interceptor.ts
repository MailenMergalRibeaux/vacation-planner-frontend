import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

/** Hängt den HTTP-Basic-Authorization-Header an jeden Request. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const creds = authService.getCredentials();

  if (creds) {
    const encoded = btoa(`${creds.username}:${creds.password}`);
    req = req.clone({
      setHeaders: { Authorization: `Basic ${encoded}` }
    });
  }

  return next(req);
};
