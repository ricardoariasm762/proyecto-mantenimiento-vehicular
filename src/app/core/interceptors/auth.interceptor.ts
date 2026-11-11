import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.currentUser()?.token;

  let authReq = req;

  // Inyectar el token en peticiones dirigidas al backend (local, Render o rutas /api)
  if (token && (req.url.includes(authService.apiUrl) || req.url.includes('/api') || req.url.includes('localhost:8082'))) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Sesión expirada o token inválido (401). Cerrando sesión...');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};

