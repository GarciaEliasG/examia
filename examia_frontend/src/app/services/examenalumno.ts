import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExamenAlumno {
  id: number;
  titulo: string;
  descripcion: string;
  materia: string;
  docente: string;
  fecha_limite: string;
  estado: 'activo' | 'pendiente' | 'corregido';
  calificacion?: number;
  fecha_creacion: string;
  examen_alumno_id?: number;
  fecha_realizacion?: string;
  retroalimentacion?: string;
}

export interface ExamenDetalle {
  examen: any;
  preguntas: any[];
  examen_alumno_id?: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamenAlumnoService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las evaluaciones PERSONALIZADAS del alumno autenticado
   */
  getEvaluacionesAlumno(): Observable<ExamenAlumno[]> {
    return this.http.get<ExamenAlumno[]>(`${this.apiUrl}/alumno/evaluaciones/`);
  }

  /**
   * Obtiene el detalle completo de un examen con sus preguntas
   */
  getEnvioDetalle(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenId}/envio`);
  }

  getExamenDetalle(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenId}/`);
  }

  getResultadoExamen(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenId}/resultado`);
  }

  getRetroalimentacionExamen(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenId}/retroalimentacion`);
 }
  

}