import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoGuard } from './alumno-guard';
import { AuthAlumnoService } from '../services/auth-alumno';

describe('AlumnoGuard', () => {
  let guard: AlumnoGuard;
  let authServiceSpy: jasmine.SpyObj<AuthAlumnoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthAlumnoService', ['isLoggedIn']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AlumnoGuard,
        { provide: AuthAlumnoService, useValue: authSpy },
        { provide: Router, useValue: routerMock },
      ],
    });

    guard = TestBed.inject(AlumnoGuard);
    authServiceSpy = TestBed.inject(AuthAlumnoService) as jasmine.SpyObj<AuthAlumnoService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    expect(guard.canActivate()).toBeTrue();
  });

  it('should block activation and redirect when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    const result = guard.canActivate();
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/alumno/login']);
  });
});
