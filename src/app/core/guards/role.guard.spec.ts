import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'isDriver', 'isMechanic']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access when user meets role criteria', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.isMechanic.and.returnValue(true);

    const route = {
      data: { expectedRole: 'ROLE_MECHANIC' }
    } as unknown as ActivatedRouteSnapshot;

    const state = {} as RouterStateSnapshot;

    TestBed.runInInjectionContext(() => {
      const result = roleGuard(route, state);
      expect(result).toBeTrue();
    });
  });
});
