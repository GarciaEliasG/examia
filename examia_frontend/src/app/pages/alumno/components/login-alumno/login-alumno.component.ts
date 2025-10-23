import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlumnoService } from '../../../../services/alumno';

@Component({
  selector: 'app-login-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule,NgIf],
  templateUrl: './login-alumno.component.html',
  styleUrls: ['./login-alumno.component.css']
})
export class LoginAlumno {
  codigo: string = '';
  isLoading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private alumnoService: AlumnoService,
    private router: Router
  ) {}

  // Normalizar código a mayúsculas
  normalizeCode() {
    this.codigo = this.codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.error = ''; // Limpiar error al escribir
  }

  // Validar formato del código
  get isCodeValid(): boolean {
    return this.codigo.length >= 3 && this.codigo.length <= 10;
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.isCodeValid) {
      this.error = 'El código debe tener entre 3 y 10 caracteres (solo letras y números)';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    try {
      console.log('📤 Validando código:', this.codigo);
      
      const response = await this.alumnoService.validarCodigo(this.codigo).toPromise();
      
      console.log('✅ Código válido:', response);
      
      // Mostrar mensaje de éxito
      this.success = response.message;
      
      // Esperar 1.5 segundos y redirigir
      setTimeout(() => {
        this.router.navigate(['/alumno/panel'], {
          queryParams: { 
            inscrito: true,
            curso: response.curso.nombre
          }
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Error validando código:', error);
      this.error = error.error?.error || 'Error al validar el código. Intentá nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  // Ir directamente al panel (si ya tiene cursos)
  irAlPanel() {
    this.router.navigate(['/alumno/panel']);
  }
}