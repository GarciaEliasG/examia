import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamenAlumnoService } from '../../../../services/examenalumno';
import { ExamenAlumno, getIdExamen, getIdExamenAlumno, getEstadoDisplay, getBadgeClass } from '../../../../models/examen-alumno.model';
import { AuthService } from '../../../../services/auth';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  /**
   * Carga las evaluaciones del alumno desde el backend
   */
  cargarEvaluaciones() {
    this.isLoading = true;
    this.evaluacionesService.getEvaluacionesAlumno().subscribe({
      next: (data) => {
        console.log('🔍 DEBUG - Datos COMPLETOS recibidos:', data);
        
        // DEBUG específico para EXAMEN PRUEBA1
        const examenPrueba = data.find(e => e.titulo === 'EXAMEN PRUEBA1');
        if (examenPrueba) {
          console.log('🔍 DEBUG - EXAMEN PRUEBA1:', {
            id: examenPrueba.id,  // ✅ CORREGIDO: Usar 'id'
            id_examen: examenPrueba.id_examen,
            titulo: examenPrueba.titulo,
            estado: examenPrueba.estado,
            fecha_realizacion: examenPrueba.fecha_realizacion,
            calificacion: examenPrueba.calificacion,
            fecha_limite: examenPrueba.fecha_limite
          });
        }
        
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

  // ====== MÉTODOS DE NAVEGACIÓN CORREGIDOS ======

  takeEvaluation(evaluacion: ExamenAlumno) {
    if (evaluacion.estado === 'pendiente' || evaluacion.estado === 'corregido' || evaluacion.estado === 'finalizado') {
      this.selectedEvaluation = evaluacion;
      this.showFinishedModal = true;
    } else {
      // Para exámenes activos, necesitamos id_examen para las instrucciones
      this.verExamen(getIdExamen(evaluacion));
    }
  }

  verInstrucciones(examenId: number) {
    if (!examenId || examenId === 0) {
      console.error('❌ ID de examen inválido:', examenId);
      return;
    }
    console.log('🔄 Navegando a instrucciones con ID:', examenId);
    this.router.navigate(['/alumno/instrucciones', examenId]);
  }

  verExamen(examenId: number) {
    if (!examenId || examenId === 0) {
      console.error('❌ ID de examen inválido:', examenId);
      return;
    }
    console.log('🔄 Navegando a Examenes con ID:', examenId);
    this.router.navigate(['/alumno/realizar-evaluacion', examenId]);
  }
  
  verResultado(evaluacion: ExamenAlumno) {
    const examenAlumnoId = getIdExamenAlumno(evaluacion)
    if (!examenAlumnoId || examenAlumnoId === 0) {
      console.error('❌ ID de examen alumno inválido:', examenAlumnoId);
      return;
    }
    console.log('🔄 Navegando a resultado con ID:', examenAlumnoId);
    this.router.navigate(['/alumno/resultado', examenAlumnoId]);
  }

  verEnvio(examenAlumnoId: number) {
    if (!examenAlumnoId || examenAlumnoId === 0) {
      console.error('❌ ID de examen alumno inválido:', examenAlumnoId);
      return;
    }
    console.log('🔄 Navegando a envío con ID:', examenAlumnoId);
    this.router.navigate(['/alumno/envio', examenAlumnoId]);
  }

  verFeedback(evaluacion: ExamenAlumno) {
    const examenAlumnoId = getIdExamenAlumno(evaluacion);
    if (!examenAlumnoId || examenAlumnoId === 0) {
      console.error('❌ ID de examen alumno inválido:', examenAlumnoId);
      return;
    }
    console.log('🔄 Navegando a retroalimentación con ID:', examenAlumnoId);
    this.router.navigate(['/alumno/retroalimentacion', examenAlumnoId]);
  }

  continueEvaluation(evaluacion: ExamenAlumno) {
    const examenAlumnoId = getIdExamenAlumno(evaluacion);
    if (!examenAlumnoId || examenAlumnoId === 0) {
      console.error('❌ ID de evaluación inválido:', examenAlumnoId);
      return;
    }
    console.log('🔄 Continuando evaluación con ID:', examenAlumnoId);
    this.router.navigate(['/alumno/realizar-evaluacion', examenAlumnoId]);
  }

  openDiscardModal(evaluacion: ExamenAlumno) {
    this.selectedEvaluation = evaluacion;
    this.showDiscardModal = true;
  }

  discardAttempt() {
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
    return getEstadoDisplay(estado);
  }

  getBadgeClass(estado: string): string {
    return getBadgeClass(estado);
  }

  getIcon(estado: string): string {
    switch (estado) {
      case 'activo': return '🗒️';
      case 'pendiente': return '📤';
      case 'corregido': return '✅';
      case 'en_progreso': return '⏳';
      case 'finalizado': return '📝';
      default: return '📝';
    }
  }

  formatFecha(fecha: string | Date): string {
    if (!fecha) return '';
  
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }

  getFechaDisplay(evaluacion: ExamenAlumno): string {
    // ✅ CORREGIDO: Usar SOLO el campo 'estado' para determinar qué mostrar
    switch (evaluacion.estado) {
      case 'activo':
        return evaluacion.fecha_limite ? `Vence: ${this.formatFecha(evaluacion.fecha_limite)}` : 'Sin fecha límite';
      case 'pendiente':
        return evaluacion.fecha_realizacion ? `Entregado: ${this.formatFecha(evaluacion.fecha_realizacion)}` : 'Entregado';
      case 'corregido':
        return evaluacion.fecha_realizacion ? `Corregido: ${this.formatFecha(evaluacion.fecha_realizacion)}` : 'Corregido';
      case 'en_progreso':
        return `En progreso - Iniciado: ${this.formatFecha(evaluacion.fecha_inicio)}`;
      case 'finalizado':
        return `Finalizado: ${this.formatFecha(evaluacion.fecha_realizacion)}`;
      default:
        return evaluacion.fecha_limite ? `Vence: ${this.formatFecha(evaluacion.fecha_limite)}` : 'Sin fecha límite';
    }
  }

  tieneRetroalimentacion(evaluacion: ExamenAlumno): boolean {
    return evaluacion.estado === 'corregido' && !!evaluacion.retroalimentacion && evaluacion.retroalimentacion.length > 0;
  }

  // Método para recargar evaluaciones
  recargar() {
    this.cargarEvaluaciones();
  }
}