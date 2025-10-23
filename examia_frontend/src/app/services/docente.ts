// services/docente.service.ts (ACTUALIZADO COMPLETO)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get(`${this.apiUrl}/panel/`);
  }

  // Gestión de cursos
  getCursos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/`);
  }

  crearCurso(cursoData: any): Observable<any> {
    // Enviar solo nombre y descripción - el código se genera en el backend
    const data = {
      nombre: cursoData.nombre,
      descripcion: cursoData.descripcion
      // ELIMINADO: codigo
    };
    return this.http.post(`${this.apiUrl}/cursos/crear/`, data);
  }

  // Gestión de exámenes
  getExamenes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/examenes/`);
  }

  crearExamen(examenData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/examenes/crear/`, examenData);
  }

  // ========== NUEVOS MÉTODOS PARA EDICIÓN DE CORRECCIONES ==========

  // Obtener lista de exámenes ya corregidos (IA o manual)
  getExamenesCorregidos(): Observable<ExamenCorregido[]> {
    return this.http.get<ExamenCorregido[]>(`${this.apiUrl}/examenes-corregidos/`);
  }

  // Obtener detalles completos de una corrección para editar
  getDetalleCorreccion(examenAlumnoId: number): Observable<DetalleCorreccion> {
    return this.http.get<DetalleCorreccion>(`${this.apiUrl}/correccion/${examenAlumnoId}/`);
  }

  // Actualizar corrección manualmente
  actualizarCorreccion(examenAlumnoId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/correccion/${examenAlumnoId}/actualizar/`, data);
  }

  // Obtener alumnos de un curso específico para filtros
  getAlumnosPorCurso(cursoId: number): Observable<AlumnoCurso[]> {
    return this.http.get<AlumnoCurso[]>(`${this.apiUrl}/cursos/${cursoId}/alumnos/`);
  }

  // ========== MÉTODOS EXISTENTES DE CORRECCIÓN (SE MANTIENEN PARA COMPATIBILIDAD) ==========

  // Corrección de evaluaciones (métodos existentes - mantener compatibilidad)
  getEvaluacionesPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/pendientes/`);
  }

  // Este método podría estar duplicado, pero lo mantenemos por compatibilidad
  getDetalleCorreccionOld(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/${examenId}/corregir/`);
  }

  actualizarCalificacion(correccionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/correccion/actualizar/`, correccionData);
  }
}