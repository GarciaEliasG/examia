// pages/docente/components/cursos/cursos.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../../services/docente';

@Component({
  selector: 'app-cursos-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,NgIf],
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.css']
})
export class CursosDocente implements OnInit {
  cursos: any[] = [];
  isLoading: boolean = true;
  error: string = '';
  hasError: boolean = false;
  showCrearCursoModal: boolean = false;
  codigoCopiado: { [key: number]: boolean } = {}; // NUEVO: Control de códigos copiados
  
  nuevoCurso = {
    nombre: '',
    descripcion: '',
    // ELIMINADO: codigo - ahora se genera automáticamente en el backend
  };

  constructor(
    private router: Router,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    this.cargarCursos();
  }

  cargarCursos() {
    this.isLoading = true;
    this.hasError = false;
    
    this.docenteService.getCursos().subscribe({
      next: (data: any) => {
        console.log('✅ Cursos cargados:', data);
        this.cursos = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('❌ Error cargando cursos:', error);
        this.error = this.obtenerMensajeError(error);
        this.isLoading = false;
        this.hasError = true;
        
        // Datos de ejemplo como fallback
        this.cargarCursosEjemplo();
      }
    });
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 403) {
      return 'No tienes permisos para ver los cursos';
    } else if (error.status === 401) {
      return 'Debes iniciar sesión para acceder a los cursos';
    } else if (error.status === 404) {
      return 'No se encontraron cursos';
    } else {
      return 'Error al cargar los cursos. Intenta nuevamente.';
    }
  }

  private cargarCursosEjemplo() {
    this.cursos = [
      {
        id: 1,
        nombre: 'Matemáticas Avanzadas',
        descripcion: 'Curso de matemáticas para nivel avanzado',
        codigo: 'MAT101',
        codigo_acceso: 'MAT123', // NUEVO: Código de acceso
        cantidad_alumnos: 25,
        cantidad_examenes: 2,
        estado: 'activo',
        profesor_titular: 'Titular'
      },
      {
        id: 2,
        nombre: 'Programación I',
        descripcion: 'Introducción a la programación con Python',
        codigo: 'PROG101',
        codigo_acceso: 'PRO456', // NUEVO: Código de acceso
        cantidad_alumnos: 30,
        cantidad_examenes: 3,
        estado: 'activo',
        profesor_titular: 'Titular'
      },
      {
        id: 3,
        nombre: 'Base de Datos',
        descripcion: 'Fundamentos de bases de datos relacionales',
        codigo: 'BD101',
        codigo_acceso: 'BD789', // NUEVO: Código de acceso
        cantidad_alumnos: 20,
        cantidad_examenes: 1,
        estado: 'activo',
        profesor_titular: 'Titular'
      }
    ];
  }

  crearCurso() {
    if (!this.nuevoCurso.nombre.trim()) {
      alert('El nombre del curso es requerido');
      return;
    }

    // ELIMINADO: Generación manual de código - ahora lo hace el backend

    this.docenteService.crearCurso(this.nuevoCurso).subscribe({
      next: (response) => {
        console.log('✅ Curso creado:', response);
        this.cerrarCrearCursoModal();
        this.cargarCursos(); // Recargar la lista para ver el código generado
      },
      error: (error) => {
        console.error('❌ Error creando curso:', error);
        alert('Error al crear el curso. Verifica los datos e intenta nuevamente.');
      }
    });
  }

  // NUEVO: Método para copiar código al portapapeles
  async copiarCodigo(codigo: string, cursoId: number) {
    if (!codigo) {
      alert('El código aún no está disponible');
      return;
    }

    try {
      await navigator.clipboard.writeText(codigo);
      this.codigoCopiado[cursoId] = true;
      
      // Resetear después de 2 segundos
      setTimeout(() => {
        this.codigoCopiado[cursoId] = false;
      }, 2000);
      
    } catch (err) {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = codigo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.codigoCopiado[cursoId] = true;
      setTimeout(() => {
        this.codigoCopiado[cursoId] = false;
      }, 2000);
    }
  }

  abrirCrearCursoModal() {
    this.showCrearCursoModal = true;
  }

  cerrarCrearCursoModal() {
    this.showCrearCursoModal = false;
    this.nuevoCurso = { 
      nombre: '', 
      descripcion: '', 
      // ELIMINADO: codigo
    };
  }

  verCursoDetalles(cursoId: number) {
    this.router.navigate(['/docente/cursos', cursoId]);
  }

  gestionarAlumnos(cursoId: number) {
    this.router.navigate(['/docente/cursos', cursoId, 'alumnos']);
  }

  crearEvaluacion(cursoId: number) {
    this.router.navigate(['/docente/crear-evaluacion'], { 
      queryParams: { curso_id: cursoId } 
    });
  }

  verEvaluacionesCurso(cursoId: number) {
    this.router.navigate(['/docente/evaluaciones'], { 
      queryParams: { curso_id: cursoId } 
    });
  }

  recargar() {
    this.cargarCursos();
  }
}