import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.role === 'ADMIN') {
    return true;
  }

  // Redirect to dashboard if not admin
  router.navigate(['/dashboard']);
  return false;
};

