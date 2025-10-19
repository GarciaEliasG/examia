import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamenAlumnoService, ExamenAlumno } from '../../../../services/examenalumno';
import { AuthService } from '../../../../services/auth';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.css']
})
export class ExamenesAlumno implements OnInit {
  // Estado del componente
  evaluaciones: ExamenAlumno[] = [];
  filteredEvaluaciones: ExamenAlumno[] = [];
  isLoading: boolean = true;
  error: string = '';

  // Filtros
  searchTerm: string = '';
  estadoFilter: string = 'todos';
  materiaFilter: string = 'todos';
  selectedSort: string = '';

  // Modales
  showDiscardModal = false;
  showFinishedModal = false;
  selectedEvaluation?: ExamenAlumno;

  // CAMBIO: Cambiar a public para que el template pueda acceder
  materiaDesdeMaterias: string = '';

  constructor(
    private evaluacionesService: ExamenAlumnoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar si viene filtrado por materia
    this.route.queryParams.subscribe(params => {
      this.materiaDesdeMaterias = params['materia'] || '';
      if (this.materiaDesdeMaterias) {
        this.materiaFilter = this.materiaDesdeMaterias;
      }
      this.cargarEvaluaciones();
    });
  }

  // ... el resto de los métodos se mantiene igual ...
  /**
   * Carga las evaluaciones del alumno desde el backend
   */
  cargarEvaluaciones() {
    this.isLoading = true;
    this.evaluacionesService.getEvaluacionesAlumno().subscribe({
      next: (data) => {
        this.evaluaciones = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las evaluaciones. Por favor, intenta nuevamente.';
        this.isLoading = false;
        console.error('Error cargando evaluaciones:', error);
        
        if (error.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  // ====== MÉTODOS DE FILTRADO ======

  aplicarFiltros() {
    this.filteredEvaluaciones = this.evaluaciones.filter(evalu => {
      const matchesSearch = !this.searchTerm || 
        evalu.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        evalu.materia.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        evalu.docente.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesEstado = this.estadoFilter === 'todos' || evalu.estado === this.estadoFilter;
      const matchesMateria = this.materiaFilter === 'todos' || evalu.materia === this.materiaFilter;
      
      return matchesSearch && matchesEstado && matchesMateria;
    });

    // Aplicar ordenamiento si está seleccionado
    if (this.selectedSort) {
      this.aplicarOrdenamiento();
    }
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.aplicarFiltros();
  }

  onEstadoFilterChange(estado: string) {
    this.estadoFilter = estado;
    this.aplicarFiltros();
  }

  onMateriaFilterChange(materia: string) {
    this.materiaFilter = materia;
    this.aplicarFiltros();
  }

  onSortChange(sort: string) {
    this.selectedSort = sort;
    this.aplicarFiltros();
  }

  aplicarOrdenamiento() {
    switch (this.selectedSort) {
      case 'Más próximas primero':
        this.filteredEvaluaciones.sort((a, b) => {
          const fechaA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : Number.MAX_SAFE_INTEGER;
          const fechaB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : Number.MAX_SAFE_INTEGER;
          return fechaA - fechaB;
        });
        break;
      case 'Más recientes':
        this.filteredEvaluaciones.sort((a, b) => {
          const fechaA = a.fecha_realizacion ? new Date(a.fecha_realizacion).getTime() : 0;
          const fechaB = b.fecha_realizacion ? new Date(b.fecha_realizacion).getTime() : 0;
          return fechaB - fechaA;
        });
        break;
      case 'Mejor calificación':
        this.filteredEvaluaciones.sort((a, b) => {
          const califA = a.calificacion || 0;
          const califB = b.calificacion || 0;
          return califB - califA;
        });
        break;
    }
  }

  // ====== MÉTODOS DE NAVEGACIÓN ======

  takeEvaluation(evaluacion: ExamenAlumno) {
    if (evaluacion.estado === 'pendiente' || evaluacion.estado === 'corregido') {
      this.selectedEvaluation = evaluacion;
      this.showFinishedModal = true;
    } else {
      this.verInstrucciones(evaluacion.id);
    }
  }

  verInstrucciones(evaluacionId: number) {
    this.router.navigate(['/alumno/instrucciones', evaluacionId]);
  }

  verResultado(evaluacionId: number) {
    this.router.navigate(['/alumno/resultado', evaluacionId]);
  }

  verEnvio(evaluacionId: number) {
    this.router.navigate(['/alumno/envio', evaluacionId]);
  }

  verFeedback(evaluacion: ExamenAlumno) {
    this.router.navigate(['/alumno/retroalimentacion', evaluacion.id]);
  }

  continueEvaluation(evaluacion: ExamenAlumno) {
    this.router.navigate(['/alumno/realizar-evaluacion', evaluacion.id]);
  }

  openDiscardModal(evaluacion: ExamenAlumno) {
    this.selectedEvaluation = evaluacion;
    this.showDiscardModal = true;
  }

  discardAttempt() {
    // Lógica para descartar intento
    console.log('Descartando intento de:', this.selectedEvaluation?.titulo);
    this.showDiscardModal = false;
  }

  closeModals() {
    this.showDiscardModal = false;
    this.showFinishedModal = false;
  }

  // ====== MÉTODOS HELPER ======

  get materiasUnicas(): string[] {
    return [...new Set(this.evaluaciones.map(e => e.materia))];
  }

  getEstadoDisplay(estado: string): string {
    switch (estado) {
      case 'activo': return 'Activa';
      case 'pendiente': return 'Entregada';
      case 'corregido': return 'Corregida';
      default: return estado;
    }
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'activo': return 'badge badge-activa';
      case 'pendiente': return 'badge badge-curso';
      case 'corregido': return 'badge badge-corr';
      default: return 'badge';
    }
  }

  getIcon(estado: string): string {
    switch (estado) {
      case 'activo': return '🗒️';
      case 'pendiente': return '📤';
      case 'corregido': return '✅';
      default: return '📝';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFechaDisplay(evaluacion: ExamenAlumno): string {
    switch (evaluacion.estado) {
      case 'activo':
        return evaluacion.fecha_limite ? `Vence: ${this.formatFecha(evaluacion.fecha_limite)}` : 'Sin fecha límite';
      case 'pendiente':
        return evaluacion.fecha_realizacion ? `Entregado: ${this.formatFecha(evaluacion.fecha_realizacion)}` : 'Entregado';
      case 'corregido':
        return evaluacion.fecha_realizacion ? `Corregido: ${this.formatFecha(evaluacion.fecha_realizacion)}` : 'Corregido';
      default:
        return '';
    }
  }

  tieneRetroalimentacion(evaluacion: ExamenAlumno): boolean {
    return evaluacion.estado === 'corregido' && !!evaluacion.retroalimentacion;
  }

  // Método para recargar evaluaciones
  recargar() {
    this.cargarEvaluaciones();
  }
}