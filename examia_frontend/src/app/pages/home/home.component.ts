import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, LoginData } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  //Aca tambien actualizamos el onSubmit 
  onSubmit() {
    //Usamos interfaz LoginData

    //mantenemos el estado del login nuevamente
    console.log('Intentando iniciar sesión...');

    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData: LoginData = this.loginForm.value;
    console.log('Datos enviados:', loginData);

    //Usamos el authService anteriormente definido para manejar las redirecciones en caso de exito
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login exitoso', response);
      },
      //Manejamos errores
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.detail || 'Usuario o contraseña incorrectos';
        console.error('Error en login:', error);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
}