import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pregunta, PreguntaWrapper } from '../models/pregunta.model';

const baseUrl = 'http://localhost:8000/api/cursos/';

@Injectable({
  providedIn: 'root'
})
export class PreguntaService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<PreguntaWrapper> {
    return this.http.get<PreguntaWrapper>(baseUrl);
  }

  getById(id: number): Observable<Pregunta> {
    return this.http.get<Pregunta>(`${baseUrl}${id}/`);
  }

  create(pregunta: Pregunta): Observable<Pregunta> {
    return this.http.post<Pregunta>(baseUrl, pregunta);
  }

  update(id: number, pregunta: Pregunta): Observable<Pregunta> {
    return this.http.put<Pregunta>(`${baseUrl}${id}/`, pregunta);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}
