import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';


//Estructura para los datos del login
export interface LoginData {
  username: string;
  password: string;
}

//Estrctura para la respuesta del backend
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    rol: string;
  };
}

//Estrcutura para los datos del registro
export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
  email: string;
  rol: string;
  nombre?: string;
  apellido?: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //Le asignamos una ruta 
  private apiUrl = 'http://localhost:8000/api/auth';
  //Manejaremos los estados del usuario de manera automatica
  //Mantenemos el estado actual del usuario
  private currentUserSubject = new BehaviorSubject<any>(null);
  //Observable que otros componentes pueden escuchar
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  //Actualizamos el metodo de login
  //Ahora el mismo: 
  //Guarda el Token y datos del usuario en localStorage
  //Actualiza el estado global
  //Le asignamos la redireccion automatica segun el rol y mejoramos el manejo de errores
  login(loginData: LoginData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          
          // Redirigir según el rol
          if (response.user.rol === 'profesor') {
            this.router.navigate(['/docente']);
          } else {
            this.router.navigate(['/alumno']);
          }
        })
      );
  }

  //Nuevo metodo de register
  //Envia los datos al Backend y retorna observables para manejar respuestas/errores
  register(registerData: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, registerData);
  }


  //Creamos un metodo para que limpie los datos una vez cerrada la sesion
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  //Obtener el token del localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  //Verificacion de si el usuario esta autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  //Obtiene el usuario actual
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

}