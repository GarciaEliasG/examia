import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ✅ Asegurar import
import { DocenteService, ExamenCorregido } from '../../../../services/docente';

@Component({
  selector: 'app-corregir-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corregir-evaluaciones.component.html',
  styleUrls: ['./corregir-evaluaciones.component.css']
})
export class CorregirEvaluaciones implements OnInit {
  
  examenesCorregidos: ExamenCorregido[] = [];
  examenesFiltrados: ExamenCorregido[] = [];
  loading: boolean = true;
  error: string = '';

  // Filtros
  filtroCurso: string = '';
  filtroAlumno: string = '';
  cursosUnicos: string[] = [];
  alumnosUnicos: string[] = [];

  constructor(
    private docenteService: DocenteService,
    public router: Router // ✅ CAMBIAR de 'private' a 'public'
  ) {}

  ngOnInit() {
    this.cargarExamenesCorregidos();
  }

  cargarExamenesCorregidos() {
    this.loading = true;
    this.docenteService.getExamenesCorregidos().subscribe({
      next: (data) => {
        this.examenesCorregidos = data;
        this.examenesFiltrados = data;
        this.extraerFiltros();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los exámenes corregidos';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  extraerFiltros() {
    // Extraer cursos únicos
    this.cursosUnicos = [...new Set(this.examenesCorregidos.map(e => e.curso))];
    
    // Extraer alumnos únicos
    this.alumnosUnicos = [...new Set(this.examenesCorregidos.map(e => e.alumno_nombre))];
  }

  aplicarFiltros() {
    this.examenesFiltrados = this.examenesCorregidos.filter(examen => {
      const coincideCurso = !this.filtroCurso || examen.curso === this.filtroCurso;
      const coincideAlumno = !this.filtroAlumno || examen.alumno_nombre.includes(this.filtroAlumno);
      return coincideCurso && coincideAlumno;
    });
  }

  limpiarFiltros() {
    this.filtroCurso = '';
    this.filtroAlumno = '';
    this.examenesFiltrados = this.examenesCorregidos;
  }

  editarCorreccion(examenAlumnoId: number) {
    this.router.navigate(['/docente/editar-correccion', examenAlumnoId]);
  }

  getBadgeClass(corregidoPor: string): string {
    return corregidoPor === 'IA' ? 'badge badge-ia' : 'badge badge-manual';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'corregido': return 'estado-corregido';
      case 'pendiente': return 'estado-pendiente';
      default: return 'estado-default';
    }
  }

  // ✅ NUEVO MÉTODO para navegación desde el template
  volverAlPanel() {
    this.router.navigate(['/docente/panel']);
  }
}