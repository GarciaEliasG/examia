import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Examen, ExamenWrapper } from '../models/examen.model';

// URL CORREGIDA: apunta a /api/examenes/ en lugar de /api/cursos/
const baseUrl = 'http://localhost:8000/api/examenes/';

@Injectable({
  providedIn: 'root'
})
export class ExamenService {

  constructor(private http: HttpClient) { }

  // ====== MÉTODOS CRUD EXISTENTES ======

  getAll(): Observable<ExamenWrapper> {
    return this.http.get<ExamenWrapper>(baseUrl);
  }

  getById(id: number): Observable<Examen> {
    return this.http.get<Examen>(`${baseUrl}${id}/`);
  }

  create(examen: Examen): Observable<Examen> {
    return this.http.post<Examen>(baseUrl, examen);
  }

  update(id: number, examen: Examen): Observable<Examen> {
    return this.http.put<Examen>(`${baseUrl}${id}/`, examen);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}${id}/`);
  }

  // ====== MÉTODO NUEVO ======

  getPreguntasByExamen(examenId: number): Observable<any> {
    return this.http.get(`${baseUrl}${examenId}/preguntas/`);
  }
}