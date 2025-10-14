import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterData } from '../../services/auth';

//Modificamos bastantes cosas aqui
//Creamos un From reactivo

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    //ponemos todos los campos como obligatorios
    //validamos el tipo email y ponemos cantidad de caracteres minimos en usuario y contrasenia
    //agregamos validadores de contrasenia
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
      rol: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  //Personalizamos el validador de contrasenia
  //Valida a nivel formulario, no campo individual
  //compara que contrasenia y validar contrasenia sean iguales
  //retorna dependiendo el resultado
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirm_password')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  //Mejoramos el metodo onSubmit
  onSubmit() {
    //Agregaremos el estado del login mientras se procesa el registro
    //Manejamos errores que nos puedan salir con el backend
    //Nos redirigirá al login de registro exitoso
    //Y validamos todo antes de enviar al backend
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.registerForm.value;
      const registerData: RegisterData = {
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirm_password,
        email: formData.email,
        rol: formData.rol,
        nombre: formData.nombre,
        apellido: formData.apellido
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          //Mensaje de exito
          this.successMessage = 'Registro exitoso. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          //Manejo de errores
          this.loading = false;
          this.errorMessage = error.error?.message || 
                            error.error?.username?.[0] || 
                            error.error?.email?.[0] || 
                            'Error en el registro';
          console.error('Error de registro:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }
}