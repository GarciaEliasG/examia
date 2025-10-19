import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExamenAlumnoService } from '../../../../services/examenalumno';

interface ExamenInstrucciones {
  id: number;
  titulo: string;
  materia: string;
  docente: string;
  descripcion: string;
  fecha_limite: string;
  duracion_minutos: number;
  intento_unico: boolean;
  preguntas_count: number;
}

@Component({
  selector: 'app-instrucciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instrucciones.component.html',
  styleUrls: ['./instrucciones.component.css']
})
export class Instrucciones implements OnInit {
  evaluationId: string = '';
  examen: ExamenInstrucciones | null = null;
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadExamenData();
  }

  loadExamenData() {
    this.isLoading = true;
    this.evaluacionesService.getExamenDetalle(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        this.examen = {
          id: data.examen.id,
          titulo: data.examen.titulo,
          materia: data.materia || 'Sin materia',
          docente: data.docente || 'Sin docente',
          descripcion: data.examen.descripcion || 'Sin descripción',
          fecha_limite: data.examen.fecha_limite,
          duracion_minutos: data.examen.duracion_minutos || 60,
          intento_unico: data.examen.intento_unico !== false,
          preguntas_count: data.preguntas?.length || 0
        };
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las instrucciones del examen';
        this.isLoading = false;
        console.error('Error cargando examen:', error);
      }
    });
  }

  startEvaluation() {
    if (this.examen) {
      this.router.navigate(['/alumno/realizar-evaluacion', this.examen.id]);
    }
  }

  volver() {
    this.router.navigate(['/alumno/evaluaciones']);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha límite';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}