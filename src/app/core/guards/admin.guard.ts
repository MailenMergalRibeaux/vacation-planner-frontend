import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Führungskräfte: immer erlaubt
  if (authService.hasRole('FUEHRUNGSKRAFT')) {
    return true;
  }

  // 2. Mitarbeiter: eigene Bearbeiten-Seite erlauben
  const current = authService.getCurrentMitarbeiter();
  const requestedId = route.paramMap.get('id');

  if (current && current.rolle === 'MITARBEITER' && requestedId === current.id) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
