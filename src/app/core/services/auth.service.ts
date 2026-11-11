import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginRequest, RegisterRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'veloce_auth_user';

  public get apiUrl(): string {
    return localStorage.getItem('veloce_custom_api_url') || environment.apiUrl;
  }

  private get baseUrl(): string {
    return `${this.apiUrl}/api/auth`;
  }

  // Auth state using Angular Signal
  public readonly currentUser = signal<AuthUser | null>(this.loadUserFromStorage());

  // Computed state
  public readonly isAuthenticated = computed<boolean>(() => !!this.currentUser());
  
  public readonly isDriver = computed<boolean>(() => {
    const role = this.currentUser()?.role;
    return role === 'ROLE_DRIVER' || role === 'DRIVER';
  });

  public readonly isMechanic = computed<boolean>(() => {
    const role = this.currentUser()?.role;
    return role === 'ROLE_MECHANIC' || role === 'MECHANIC';
  });

  public readonly userFullName = computed<string>(() => {
    const user = this.currentUser();
    if (!user) return 'INVITADO / SIN SESIÓN';
    return user.fullName || user.email;
  });

  public readonly userRoleLabel = computed<string>(() => {
    if (!this.currentUser()) return 'OPERADOR NO IDENTIFICADO';
    return this.isMechanic() ? 'JEFE MECÁNICO TALLER' : 'CONDUCTOR ASIGNADO';
  });

  public readonly defaultPlate = computed<string>(() => {
    return this.currentUser()?.defaultLicensePlate || 'TRX-720';
  });

  private loadUserFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch (e) {
      console.warn('Error leyendo usuario desde localStorage:', e);
    }
    return null;
  }

  public login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/login`, credentials).pipe(
      tap((user) => {
        this.saveUser(user);
      })
    );
  }

  public register(data: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/register`, data).pipe(
      tap((user) => {
        this.saveUser(user);
      })
    );
  }

  public fetchCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        const current = this.currentUser();
        if (current) {
          const updated: AuthUser = {
            ...user,
            token: current.token
          };
          this.saveUser(updated);
        }
      })
    );
  }

  public saveUser(user: AuthUser): void {
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Error guardando usuario en localStorage:', e);
    }
  }

  public logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Error eliminando usuario de localStorage:', e);
    }
  }
}

