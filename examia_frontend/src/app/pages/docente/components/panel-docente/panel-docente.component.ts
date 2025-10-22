// pages/docente/components/panel-docente/panel-docente.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocenteService } from '../../../../services/docente';

@Component({
  selector: 'app-panel-docente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-docente.component.html',
  styleUrls: ['./panel-docente.component.css']
})
export class PanelDocente implements OnInit {
  docenteData: any = null;
  isLoading: boolean = true;
  error: string = '';
  hasError: boolean = false;

  constructor(
    private router: Router,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    this.cargarPanelDocente();
  }

  cargarPanelDocente() {
    this.isLoading = true;
    this.hasError = false;
    
    this.docenteService.getPanelDocente().subscribe({
      next: (data) => {
        console.log('✅ Datos del panel cargados:', data);
        this.docenteData = data;
        this.isLoading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('❌ Error cargando panel docente:', error);
        this.error = this.obtenerMensajeError(error);
        this.isLoading = false;
        this.hasError = true;
        
        // Datos de ejemplo como fallback para desarrollo
        this.cargarDatosEjemplo();
      }
    });
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 403) {
      return 'No tienes permisos para acceder al panel docente';
    } else if (error.status === 401) {
      return 'Debes iniciar sesión para acceder al panel';
    } else if (error.status === 404) {
      return 'El servicio no está disponible en este momento';
    } else {
      return 'Error al cargar el panel del docente. Intenta nuevamente.';
    }
  }

  private cargarDatosEjemplo() {
    this.docenteData = {
      docente: {
        id: 1,
        nombre: 'Profesor Ejemplo',
        email: 'profesor@ejemplo.com'
      },
      estadisticas: {
        totalCursos: 3,
        totalExamenes: 5,
        totalAlumnos: 45,
        pendientesCorreccion: 2
      },
      cursosRecientes: [
        {
          id: 1,
          nombre: 'Matemáticas Avanzadas',
          descripcion: 'Curso de matemáticas para nivel avanzado',
          cantidad_alumnos: 25,
          cantidad_examenes: 2
        },
        {
          id: 2,
          nombre: 'Programación I',
          descripcion: 'Introducción a la programación',
          cantidad_alumnos: 20,
          cantidad_examenes: 3
        }
      ]
    };
  }

  recargar() {
    this.cargarPanelDocente();
  }

  navegarARuta(ruta: string) {
    this.router.navigate([`/docente/${ruta}`]);
  }
}