import { Component, OnInit } from '@angular/core'; // <-- 1. Importa OnInit
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel-docente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-docente.html', // Corregido para que no tenga '.component'
  styleUrls: ['./panel-docente.css']
})
export class PanelDocente implements OnInit { // <-- 2. Implementa OnInit

  // 3. Creamos una propiedad para almacenar el número de evaluaciones
  public evaluacionesCount: number = 0;

  constructor(private router: Router) {}

  // 4. ngOnInit se ejecuta cuando el componente se carga
  ngOnInit(): void {
    this.cargarContadorEvaluaciones();
  }

  cargarContadorEvaluaciones(): void {
    try {
      // Leemos el item de localStorage
      const datosGuardados = localStorage.getItem('evaluaciones');
      if (datosGuardados) {
        const items = JSON.parse(datosGuardados);
        // Nos aseguramos de que sea un array y actualizamos la propiedad
        this.evaluacionesCount = Array.isArray(items) ? items.length : 0;
      } else {
        this.evaluacionesCount = 0;
      }
    } catch (error) {
      // Si hay un error (ej. JSON mal formado), dejamos el contador en 0
      console.error("Error al leer evaluaciones de localStorage:", error);
      this.evaluacionesCount = 0;
    }
  }

  // El método volver ya no es necesario si usas routerLink en el HTML, pero lo dejamos por si lo usas en otro sitio
  volver() {
    this.router.navigate(['/']); // Navega a la ruta principal o al login
  }
}