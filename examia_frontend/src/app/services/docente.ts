// services/docente.service.ts (ACTUALIZADO)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  // Usar URL absoluta para desarrollo
  private apiUrl = 'http://127.0.0.1:8000/api/docente';

  constructor(private http: HttpClient) { }

  // Panel principal
  getPanelDocente(): Observable<any> {
    return this.http.get(`${this.apiUrl}/panel/`);
  }

  // Gestión de cursos
  getCursos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/`);
  }

  crearCurso(cursoData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cursos/crear/`, cursoData);
  }

  // Gestión de exámenes
  getExamenes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/examenes/`);
  }

  crearExamen(examenData: any): Observable<any> {
    return this.http.post(`http://localhost:8000/api/docente/examenes/crear/`, examenData);
  }
  // Corrección de evaluaciones
  getEvaluacionesPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/pendientes/`);
  }

  getDetalleCorreccion(examenId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/${examenId}/corregir/`);
  }

  actualizarCalificacion(correccionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/correccion/actualizar/`, correccionData);
  }
}