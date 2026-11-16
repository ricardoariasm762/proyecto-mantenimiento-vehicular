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
  router.navigate(['/']);
  return false;
};

export const driverGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isDriver()) {
    return true;
  }

  console.warn('Access denied: View reserved exclusively for Drivers');
  router.navigate(['/']);
  return false;
};

export const roleGuard = (expectedRole: 'ROLE_DRIVER' | 'ROLE_MECHANIC'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/']);
      return false;
    }

    const currentRole = authService.currentUser()?.role;
    if (currentRole === expectedRole) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
};

