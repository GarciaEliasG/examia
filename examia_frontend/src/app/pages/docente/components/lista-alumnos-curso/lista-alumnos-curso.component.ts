import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteService, AlumnosConEvaluaciones, AlumnoConEvaluaciones } from '../../../../services/docente';

@Component({
  selector: 'app-lista-alumnos-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-alumnos-curso.component.html',
  styleUrls: ['./lista-alumnos-curso.component.css']
})
export class ListaAlumnosCursoComponent implements OnInit {
  
  datos: AlumnosConEvaluaciones | null = null;
  alumnosFiltrados: AlumnoConEvaluaciones[] = [];
  loading: boolean = true;
  error: string = '';
  cursoId: number = 0;

  // Filtros
  filtroEstado: string = '';
  filtroAlumno: string = '';
  filtroEvaluacion: string = '';

  // Estados disponibles para filtros
  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'corregido', label: 'Corregidos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'activo', label: 'Activos' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.loading = true;
    this.error = '';
    
    const filtros = {
      ...(this.filtroEstado && { estado: this.filtroEstado }),
      ...(this.filtroAlumno && { alumno: this.filtroAlumno })
    };

    this.docenteService.getAlumnosConEvaluaciones(this.cursoId, filtros).subscribe({
      next: (data) => {
        this.datos = data;
        this.alumnosFiltrados = data.alumnos;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar los alumnos del curso';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  aplicarFiltros() {
    this.cargarAlumnos();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroAlumno = '';
    this.filtroEvaluacion = '';
    this.cargarAlumnos();
  }

  volverACursos() {
    this.router.navigate(['/docente/cursos']);
  }

  navegarAMetricas() {
    this.router.navigate(['/docente/cursos', this.cursoId, 'metricas']);
  }

  editarCorreccion(examenAlumnoId: number) {
    this.router.navigate(['/docente/editar-correccion', examenAlumnoId]);
  }

  verDetalleAlumno(alumnoId: number) {
    // Navegar al detalle del alumno (podría ser un modal o nueva página)
    console.log('Ver detalle del alumno:', alumnoId);
  }

  // Métodos utilitarios
  getColorCalificacion(calificacion: number): string {
    return this.docenteService.getColorCalificacion(calificacion);
  }

  getEstadoEvaluacion(estado: string): string {
    switch (estado) {
      case 'corregido': return 'estado-corregido';
      case 'pendiente': return 'estado-pendiente';
      case 'activo': return 'estado-activo';
      default: return 'estado-default';
    }
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case 'corregido': return 'Corregido';
      case 'pendiente': return 'Pendiente';
      case 'activo': return 'Activo';
      default: return estado;
    }
  }

  getEvaluacionesFiltradas(alumno: AlumnoConEvaluaciones) {
    if (!this.filtroEvaluacion) {
      return alumno.evaluaciones;
    }
    return alumno.evaluaciones.filter(evalu => 
      evalu.titulo_examen.toLowerCase().includes(this.filtroEvaluacion.toLowerCase())
    );
  }

  recargar() {
    this.cargarAlumnos();
  }
}