import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('roleGuard', () => {
  let routerMock: { navigate: any };
  const mockUserSignal = signal<AuthUser | null>({
    token: 'jwt-123',
    role: 'ROLE_MECHANIC',
    email: 'mech@test.com',
    fullName: 'Jefe Taller'
  });
  const mockIsAuthSignal = signal<boolean>(true);

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn()
    };

    const authServiceMock = {
      isAuthenticated: mockIsAuthSignal,
      currentUser: mockUserSignal
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when user meets role criteria', () => {
    mockIsAuthSignal.set(true);
    mockUserSignal.set({
      token: 'jwt-123',
      role: 'ROLE_MECHANIC',
      email: 'mech@test.com',
      fullName: 'Jefe Taller'
    });

    TestBed.runInInjectionContext(() => {
      const guardFn = roleGuard('ROLE_MECHANIC');
      const result = guardFn({} as any, {} as any);
      expect(result).toBe(true);
    });
  });

  it('should deny access and redirect when user has different role', () => {
    mockIsAuthSignal.set(true);
    mockUserSignal.set({
      token: 'jwt-123',
      role: 'ROLE_DRIVER',
      email: 'driver@test.com',
      fullName: 'Conductor'
    });

    TestBed.runInInjectionContext(() => {
      const guardFn = roleGuard('ROLE_MECHANIC');
      const result = guardFn({} as any, {} as any);
      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
