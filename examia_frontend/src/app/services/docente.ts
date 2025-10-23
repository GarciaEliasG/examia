// services/docente.service.ts (ACTUALIZADO COMPLETO)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ExamenCorregido {
  examen_alumno_id: number;
  examen_id: number;
  titulo_examen: string;
  curso: string;
  curso_id: number;
  alumno_nombre: string;
  alumno_id: number;
  fecha_realizacion: string;
  calificacion_final: number;
  estado: string;
  fecha_correccion: string;
  corregido_por: string;
}

export interface DetalleCorreccion {
  examen_alumno_id: number;
  examen_id: number;
  titulo_examen: string;
  curso: string;
  alumno_nombre: string;
  alumno_id: number;
  fecha_realizacion: string;
  calificacion_actual: number;
  retroalimentacion_general: string;
  preguntas: PreguntaCorreccion[];
  puntaje_total_actual: number;
  puntaje_maximo_total: number;
}

export interface PreguntaCorreccion {
  respuesta_id: number;
  pregunta_id: number;
  enunciado: string;
  tipo_pregunta: string;
  puntaje_maximo: number;
  respuesta_alumno: string;
  puntaje_actual: number;
  retroalimentacion_actual: string;
  orden: number;
}

export interface AlumnoCurso {
  id: number;
  nombre: string;
  email: string;
}

// ====== NUEVAS INTERFACES PARA MÉTRICAS ======

export interface MetricasCurso {
  curso: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  metricas_generales: {
    total_examenes: number;
    total_alumnos: number;
    total_evaluaciones_corregidas: number;
    nota_promedio_curso: number;
    examenes_sin_corregir: number;
  };
  metricas_examenes: MetricaExamen[];
}

export interface MetricaExamen {
  examen_id: number;
  titulo: string;
  nota_promedio: number;
  total_entregas: number;
  porcentaje_participacion: number;
  preguntas_problematicas: PreguntaProblematica[];
  distribucion_calificaciones: DistribucionCalificaciones;
}

export interface PreguntaProblematica {
  pregunta_id: number;
  enunciado: string;
  tipo: string;
  puntaje_promedio: number;
  puntaje_maximo: number;
  porcentaje_promedio: number;
  total_respuestas: number;
}

export interface DistribucionCalificaciones {
  excelente: number;
  bueno: number;
  regular: number;
  insuficiente: number;
  porcentaje_excelente: number;
  porcentaje_bueno: number;
  porcentaje_regular: number;
  porcentaje_insuficiente: number;
}

// ====== NUEVAS INTERFACES PARA ALUMNOS CON EVALUACIONES ======

export interface AlumnosConEvaluaciones {
  curso: {
    id: number;
    nombre: string;
  };
  total_alumnos: number;
  alumnos: AlumnoConEvaluaciones[];
}

export interface AlumnoConEvaluaciones {
  alumno_id: number;
  nombre: string;
  email: string;
  fecha_inscripcion: string;
  estadisticas: EstadisticasAlumno;
  evaluaciones: EvaluacionAlumno[];
}

export interface EstadisticasAlumno {
  total_evaluaciones: number;
  evaluaciones_corregidas: number;
  evaluaciones_pendientes: number;
  evaluaciones_activas: number;
  promedio_general: number;
}

export interface EvaluacionAlumno {
  examen_alumno_id: number;
  examen_id: number;
  titulo_examen: string;
  fecha_realizacion: string | null;
  calificacion: number | null;
  estado: 'activo' | 'pendiente' | 'corregido';
  puede_editar: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  // Usar URL absoluta para desarrollo
  private apiUrl = 'http://127.0.0.1:8000/api/docente';

  constructor(private http: HttpClient) { }

  // ========== MÉTODOS EXISTENTES (SE MANTIENEN) ==========

  // Panel principal
  getPanelDocente(): Observable<any> {
    return this.http.get(`${this.apiUrl}/panel/`).pipe(
      catchError(this.handleError)
    );
  }

  // Gestión de cursos
  getCursos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/`).pipe(
      catchError(this.handleError)
    );
  }

  crearCurso(cursoData: any): Observable<any> {
    // Enviar solo nombre y descripción - el código se genera en el backend
    const data = {
      nombre: cursoData.nombre,
      descripcion: cursoData.descripcion
      // ELIMINADO: codigo
    };
    return this.http.post(`${this.apiUrl}/cursos/crear/`, data).pipe(
      catchError(this.handleError)
    );
  }

  // Gestión de exámenes
  getExamenes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/examenes/`).pipe(
      catchError(this.handleError)
    );
  }

  crearExamen(examenData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/examenes/crear/`, examenData).pipe(
      catchError(this.handleError)
    );
  }

  // ========== NUEVOS MÉTODOS PARA EDICIÓN DE CORRECCIONES ==========

  // Obtener lista de exámenes ya corregidos (IA o manual)
  getExamenesCorregidos(): Observable<ExamenCorregido[]> {
    return this.http.get<ExamenCorregido[]>(`${this.apiUrl}/examenes-corregidos/`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener detalles completos de una corrección para editar
  getDetalleCorreccion(examenAlumnoId: number): Observable<DetalleCorreccion> {
    return this.http.get<DetalleCorreccion>(`${this.apiUrl}/correccion/${examenAlumnoId}/`).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar corrección manualmente
  actualizarCorreccion(examenAlumnoId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/correccion/${examenAlumnoId}/actualizar/`, data).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener alumnos de un curso específico para filtros
  getAlumnosPorCurso(cursoId: number): Observable<AlumnoCurso[]> {
    return this.http.get<AlumnoCurso[]>(`${this.apiUrl}/cursos/${cursoId}/alumnos/`).pipe(
      catchError(this.handleError)
    );
  }

  // ========== MÉTODOS EXISTENTES DE CORRECCIÓN (SE MANTIENEN PARA COMPATIBILIDAD) ==========

  // Corrección de evaluaciones (métodos existentes - mantener compatibilidad)
  getEvaluacionesPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/pendientes/`).pipe(
      catchError(this.handleError)
    );
  }

  // Este método podría estar duplicado, pero lo mantenemos por compatibilidad
  getDetalleCorreccionOld(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/${examenId}/corregir/`).pipe(
      catchError(this.handleError)
    );
  }

  actualizarCalificacion(correccionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/correccion/actualizar/`, correccionData).pipe(
      catchError(this.handleError)
    );
  }

  // ========== NUEVOS MÉTODOS PARA MÉTRICAS Y ALUMNOS ==========

  /**
   * Obtener métricas completas de un curso
   */
  getMetricasCurso(cursoId: number): Observable<MetricasCurso> {
    return this.http.get<MetricasCurso>(`${this.apiUrl}/cursos/${cursoId}/metricas/`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener listado de alumnos con sus evaluaciones
   */
  getAlumnosConEvaluaciones(cursoId: number, filtros?: { estado?: string, alumno?: string }): Observable<AlumnosConEvaluaciones> {
    let url = `${this.apiUrl}/cursos/${cursoId}/alumnos-evaluaciones/`;
    
    // Agregar parámetros de filtro si existen
    if (filtros) {
      const params = new HttpParams({
        fromObject: {
          ...(filtros.estado && { estado: filtros.estado }),
          ...(filtros.alumno && { alumno: filtros.alumno })
        }
      });
      return this.http.get<AlumnosConEvaluaciones>(url, { params }).pipe(
        catchError(this.handleError)
      );
    }
    
    return this.http.get<AlumnosConEvaluaciones>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener evaluaciones específicas de un alumno en un curso
   */
  getEvaluacionesPorAlumno(alumnoId: number, cursoId: number): Observable<EvaluacionAlumno[]> {
    return this.http.get<EvaluacionAlumno[]>(
      `${this.apiUrl}/cursos/${cursoId}/alumnos/${alumnoId}/evaluaciones/`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener detalle completo de una evaluación para edición
   * (Reutiliza el endpoint existente de corrección)
   */
  getDetalleEvaluacionParaEdicion(examenAlumnoId: number): Observable<DetalleCorreccion> {
    return this.http.get<DetalleCorreccion>(`${this.apiUrl}/correccion/${examenAlumnoId}/`).pipe(
      catchError(this.handleError)
    );
  }

  // ========== MANEJO DE ERRORES ==========

  private handleError(error: any): Observable<never> {
    console.error('❌ Error en servicio docente:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para esta acción';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado - por favor inicia sesión nuevamente';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ========== MÉTODOS UTILITARIOS ==========

  /**
   * Calcular color según calificación (para usar en componentes)
   */
  getColorCalificacion(calificacion: number): string {
    if (calificacion >= 80) return 'excelente';
    if (calificacion >= 60) return 'bueno';
    if (calificacion >= 40) return 'regular';
    return 'insuficiente';
  }

  /**
   * Formatear porcentaje para mostrar
   */
  formatearPorcentaje(valor: number, total: number): string {
    if (total === 0) return '0%';
    const porcentaje = (valor / total) * 100;
    return `${porcentaje.toFixed(1)}%`;
  }

  /**
   * Calcular progreso de corrección
   */
  calcularProgresoCorreccion(corregidas: number, total: number): number {
    if (total === 0) return 0;
    return (corregidas / total) * 100;
  }

  /**
   * Generar datos para gráfico de distribución
   */
  generarDatosGrafico(distribucion: DistribucionCalificaciones): any[] {
    return [
      { 
        name: 'Excelente', 
        value: distribucion.excelente, 
        color: '#10b981',
        porcentaje: distribucion.porcentaje_excelente
      },
      { 
        name: 'Bueno', 
        value: distribucion.bueno, 
        color: '#3b82f6',
        porcentaje: distribucion.porcentaje_bueno
      },
      { 
        name: 'Regular', 
        value: distribucion.regular, 
        color: '#f59e0b',
        porcentaje: distribucion.porcentaje_regular
      },
      { 
        name: 'Insuficiente', 
        value: distribucion.insuficiente, 
        color: '#ef4444',
        porcentaje: distribucion.porcentaje_insuficiente
      }
    ];
  }
}