import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Curso, CursoWrapper } from '../models/curso.model';

const baseUrl = 'http://localhost:8000/api/cursos/';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<CursoWrapper> {
    return this.http.get<CursoWrapper>(baseUrl);
  }

  getById(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${baseUrl}${id}/`);
  }

  create(curso: Curso): Observable<Curso> {
    return this.http.post<Curso>(baseUrl, curso);
  }

  update(id: number, curso: Curso): Observable<Curso> {
    return this.http.put<Curso>(`${baseUrl}${id}/`, curso);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}

