import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MateriasService } from '../../../../services/materias';
import { AuthService } from '../../../../services/auth'; // Importar AuthService

interface Course {
  id: number;
  name: string;
  code: string;
  teacher: string;
  classroom: string;
  schedule: string;
  status: string;
  hasActiveEvaluation: boolean;
}

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.component.html',
  styleUrls: ['./materias.component.css']
})
export class Materias implements OnInit {
  searchTerm: string = '';
  selectedTurn: string = '';
  selectedStatus: string = '';

  courses: Course[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private router: Router,
    private materiasService: MateriasService,
    private authService: AuthService // Inyectar AuthService
  ) {}

  ngOnInit() {
    // Verificar autenticación antes de cargar
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/alumno/login']);
      return;
    }
    
    this.cargarMaterias();
  }

  cargarMaterias() {
    this.isLoading = true;
    this.error = '';

    this.materiasService.getMateriasAlumno().subscribe({
      next: (data: any) => {
        console.log('✅ Materias cargadas correctamente:', data);
        this.procesarMaterias(data);
      },
      error: (error) => {
        console.error('❌ Error cargando materias:', error);
        
        if (error.status === 401) {
          this.error = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/alumno/login']);
          }, 2000);
        } else if (error.status === 403) {
          this.error = 'No tienes permisos para acceder a esta información.';
        } else if (error.status === 404) {
          this.error = 'No se encontraron materias para tu usuario.';
        } else {
          this.error = `Error al cargar las materias: ${error.status} ${error.statusText}`;
        }
        
        this.isLoading = false;
      }
    });
  }

  procesarMaterias(data: any[]) {
    if (data && data.length > 0) {
      this.courses = data.map(curso => ({
        id: curso.id,
        name: curso.nombre,
        code: curso.codigo || 'N/A',
        teacher: curso.docente || 'Sin docente asignado',
        classroom: curso.aula || 'Sin aula asignada',
        schedule: this.obtenerTurno(curso.turno),
        status: curso.tieneEvaluacionesActivas ? 'Con evaluación activa' : 'Sin evaluación',
        hasActiveEvaluation: curso.tieneEvaluacionesActivas
      }));
    } else {
      this.error = 'No estás inscrito en ninguna materia.';
    }
    this.isLoading = false;
  }

  obtenerTurno(turno: string): string {
    const turnos: {[key: string]: string} = {
      'morning': 'Mañana',
      'afternoon': 'Tarde', 
      'evening': 'Noche',
      'mañana': 'Mañana',
      'tarde': 'Tarde',
      'noche': 'Noche'
    };
    return turnos[turno] || turno;
  }

  get filteredCourses(): Course[] {
    return this.courses.filter(course => {
      const matchesSearch = !this.searchTerm || 
        course.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        course.teacher.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesTurn = !this.selectedTurn || course.schedule === this.selectedTurn;
      const matchesStatus = !this.selectedStatus || course.status === this.selectedStatus;
      
      return matchesSearch && matchesTurn && matchesStatus;
    });
  }

  enterCourse(course: Course) {
    localStorage.setItem('materia_actual', course.name);
    localStorage.setItem('materia_codigo', course.code);
    this.router.navigate(['/alumno/evaluaciones'], { 
      queryParams: { materia: course.name } 
    });
  }

  viewEvaluations(course: Course) {
    this.router.navigate(['/alumno/evaluaciones'], { 
      queryParams: { materia: course.name } 
    });
  }

  getCourseIcon(courseName: string): string {
    const icons: {[key: string]: string} = {
      'Matemática': '📘',
      'Matemática I': '📘',
      'Matemática II': '📘',
      'Química': '🧪',
      'Programación': '💻',
      'Física': '⚛️',
      'Biología': '🧬',
      'Historia': '📜',
      'Literatura': '📖'
    };
    return icons[courseName] || '📚';
  }

  // Método para recargar
  recargar() {
    this.cargarMaterias();
  }
}