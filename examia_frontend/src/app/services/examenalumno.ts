// services/examen-alumno.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExamenAlumno } from '../models/examen-alumno.model';
import { Pregunta } from '../models/pregunta.model';
import { RespuestaAlumno } from '../models/respuesta-alumno.model';

@Injectable({
  providedIn: 'root'
})
export class ExamenAlumnoService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Obtener evaluaciones del alumno
  getEvaluacionesAlumno(): Observable<ExamenAlumno[]> {
    return this.http.get<ExamenAlumno[]>(`${this.apiUrl}/alumno/evaluaciones/`);
  }

  // Obtener detalle del examen con preguntas
  getExamenDetalle(examenId: number): Observable<{examen: any, preguntas: Pregunta[]}> {
    return this.http.get<{examen: any, preguntas: Pregunta[]}>(
      `${this.apiUrl}/alumno/examen/${examenId}/`
    );
  }

  // Iniciar evaluación
  iniciarEvaluacion(examenId: number): Observable<{examen_alumno_id: number, preguntas: Pregunta[]}> {
    return this.http.post<{examen_alumno_id: number, preguntas: Pregunta[]}>(
      `${this.apiUrl}/alumno/examen/${examenId}/iniciar`, 
      {}
    );
  }

  // Guardar respuesta individual
  guardarRespuesta(respuesta: Partial<RespuestaAlumno>): Observable<RespuestaAlumno> {
    return this.http.post<RespuestaAlumno>(
      `${this.apiUrl}/alumno/respuestas/guardar`, 
      respuesta
    );
  }

  // Finalizar evaluación
  finalizarEvaluacion(examenAlumnoId: number): Observable<ExamenAlumno> {
    return this.http.post<ExamenAlumno>(
      `${this.apiUrl}/alumno/examen/${examenAlumnoId}/finalizar`, 
      {}
    );
  }

  // Obtener envío (respuestas guardadas)
  getEnvioDetalle(examenAlumnoId: number): Observable<{examen: any, respuestas: RespuestaAlumno[]}> {
    return this.http.get<{examen: any, respuestas: RespuestaAlumno[]}>(
      `${this.apiUrl}/alumno/examen/${examenAlumnoId}/envio`
    );
  }

  // Obtener resultado del examen
  getResultadoExamen(examenAlumnoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenAlumnoId}/resultado`);
  }

  // Para la segunda parte con IA
  getRetroalimentacionExamen(examenAlumnoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alumno/examen/${examenAlumnoId}/retroalimentacion`);
  }
}