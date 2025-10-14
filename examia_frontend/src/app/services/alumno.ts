import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Alumno, AlumnoWrapper } from '../models/alumno.model';

const baseUrl = 'http://localhost:8000/api/alumnos/';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<AlumnoWrapper> {
    return this.http.get<AlumnoWrapper>(baseUrl);
  }

  getById(id: number): Observable<Alumno> {
    return this.http.get<Alumno>(`${baseUrl}${id}/`);
  }

  create(alumno: Alumno): Observable<Alumno> {
    return this.http.post<Alumno>(baseUrl, alumno);
  }

  update(id: number, alumno: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${baseUrl}${id}/`, alumno);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}

