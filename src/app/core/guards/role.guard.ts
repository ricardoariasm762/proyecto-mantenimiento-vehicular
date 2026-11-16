import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const mechanicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isMechanic()) {
    return true;
  }

  console.warn('Access denied: View reserved exclusively for Mechanics');
  router.navigate(['/dashboard']);
  return false;
};

export const driverGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isDriver()) {
    return true;
  }

  console.warn('Access denied: View reserved exclusively for Drivers');
  router.navigate(['/dashboard']);
  return false;
};

