// components/resultado/resultado.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { ExamenAlumnoService } from '../../../../services/examenalumno';

interface QuestionResult {
  id: number;
  tipo: string;
  enunciado: string;
  respuesta_alumno: string;
  puntaje_obtenido: number;
  puntaje_maximo: number;
  estado: 'correct' | 'partial' | 'incorrect';
  retroalimentacion?: string;
}

interface ExamenResultado {
  id: number;
  titulo: string;
  materia: string;
  docente: string;
  fecha_correccion: string;
  tiempo_resolucion: string;
  calificacion_final: number;
  puntaje_maximo: number;
  estado: string;
  preguntas: QuestionResult[];
}

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule,NgIf],
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.css']
})
export class Resultado implements OnInit {
  evaluationId: string = '';
  examen: ExamenResultado | null = null;
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadResults();
  }

  loadResults() {
    this.isLoading = true;
    this.evaluacionesService.getResultadoExamen(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        this.examen = {
          id: data.id,
          titulo: data.titulo,
          materia: data.materia,
          docente: data.docente,
          fecha_correccion: data.fecha_correccion || new Date().toISOString(),
          tiempo_resolucion: data.tiempo_resolucion || 'No registrado',
          calificacion_final: data.calificacion_final || 0,
          puntaje_maximo: data.puntaje_maximo || 10,
          estado: data.estado || 'corregido',
          preguntas: data.preguntas || []
        };
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Error al cargar los resultados';
        this.isLoading = false;
        console.error('Error cargando resultados:', error);
      }
    });
  }

  // MÉTODO NUEVO: Verificar si hay retroalimentación
  tieneRetroalimentacion(): boolean {
    return this.examen?.preguntas?.some(p => p.retroalimentacion) || false;
  }

  viewFeedback() {
    if (this.examen) {
      this.router.navigate(['/alumno/retroalimentacion', this.examen.id]);
    }
  }

  volver() {
    this.router.navigate(['/alumno/evaluaciones']);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'correct': return '✅';
      case 'partial': return '⚠️';
      case 'incorrect': return '❌';
      default: return '❓';
    }
  }

  getEstadoTexto(calificacion: number, puntajeMaximo: number): string {
    const porcentaje = (calificacion / puntajeMaximo) * 100;
    return porcentaje >= 60 ? 'Aprobado' : 'Desaprobado';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}