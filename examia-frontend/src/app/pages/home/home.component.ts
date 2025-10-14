import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
  console.log('Intentando iniciar sesión...');

  if (this.loginForm.invalid) {
    this.errorMessage = 'Por favor, complete todos los campos';
    return;
  }

  const { username, password } = this.loginForm.value;
  console.log('Datos enviados:', username, password);

  this.authService.login(username, password).subscribe({
    next: () => console.log('Login exitoso'),
    error: () => (this.errorMessage = 'Usuario o contraseña incorrectos'),
  });

  }

}