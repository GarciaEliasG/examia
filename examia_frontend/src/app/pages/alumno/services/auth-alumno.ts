import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthAlumnoService {
  private isAuthenticated = new BehaviorSubject<boolean>(this.checkAuth());
  
  constructor(private router: Router) {}

  private checkAuth(): boolean {
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    return !!(isLoggedIn && userType === 'alumno');
  }

  loginAlumno(codigo: string): boolean {
    if (codigo) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userType', 'alumno');
      localStorage.setItem('codigoProfesor', codigo);
      this.isAuthenticated.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('codigoProfesor');
    this.isAuthenticated.next(false);
    this.router.navigate(['/alumno/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.value;
  }

  getAuthStatus() {
    return this.isAuthenticated.asObservable();
  }
}