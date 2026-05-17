import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Leitet auf /passwort um, solange der eingeloggte Mitarbeiter sein Initial-/
 * Reset-Passwort noch ändern muss (Backend-Flag passwortAenderungErforderlich).
 */
export const passwortAenderungGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.mussPasswortAendern()) {
    router.navigate(['/passwort']);
    return false;
  }
  return true;
};
