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