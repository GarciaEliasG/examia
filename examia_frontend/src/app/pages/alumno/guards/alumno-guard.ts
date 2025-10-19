import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthAlumnoService } from '../services/auth-alumno';

@Injectable({
  providedIn: 'root'
})
export class AlumnoGuard implements CanActivate {
  
  constructor(
    private authService: AuthAlumnoService, 
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/alumno/login']);
      return false;
    }
  }
}