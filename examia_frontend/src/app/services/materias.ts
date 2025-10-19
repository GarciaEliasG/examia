import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class MateriasService {
  private apiUrl = 'http://localhost:8000/api'; // Ajusta según tu API

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getMateriasAlumno(): Observable<any> {
    // Obtener el token del AuthService
    const token = this.authService.getToken();
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.apiUrl}/alumno/materias/`, { headers });
  }
}