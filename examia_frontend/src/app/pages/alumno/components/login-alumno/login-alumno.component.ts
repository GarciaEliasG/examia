import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-alumno.component.html',
  styleUrls: ['./login-alumno.component.css']
})
export class LoginAlumno {
  codigo: string = '';

  constructor(private router: Router) {}

  // Validar el código en tiempo real
  get isCodeValid(): boolean {
    const re = /^[A-Z]{3}[- ]?\d{3,5}$/;
    return re.test(this.codigo.toUpperCase().trim());
  }

  // Normalizar el código a mayúsculas
  normalizeCode() {
    this.codigo = this.codigo.toUpperCase().trim();
  }

  // Manejar el envío del formulario
  onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.isCodeValid) {
      const code = this.codigo.toUpperCase().trim();
      
      // Guardar en localStorage
      localStorage.setItem('codigo_profesor', code);
      
      // Redireccionar al panel del alumno
      this.router.navigate(['/alumno/panel']);
    }
  }
}