import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { ExamenAlumnoService } from '../../../../services/examenalumno';

interface Feedback {
  id: number;
  pregunta: string;
  userAnswer: string;
  teacherComment: string;
  scoreType: 'full' | 'partial' | 'none';
  puntajeObtenido: number;
  puntajeMaximo: number;
}

@Component({
  selector: 'app-retroalimentacion',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './retroalimentacion.component.html',
  styleUrls: ['./retroalimentacion.component.css', '../evaluaciones/evaluaciones.component.css', '../resultado/resultado.component.css']
})
export class Retroalimentacion implements OnInit {
  evaluationId: string = '';
  feedbacks: Feedback[] = [];
  examenTitulo: string = 'Retroalimentación';
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.isLoading = true;
    this.evaluacionesService.getRetroalimentacionExamen(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        this.examenTitulo = data.titulo || 'Retroalimentación';
        this.feedbacks = data.preguntas.map((pregunta: any) => ({
          id: pregunta.id,
          pregunta: pregunta.enunciado,
          userAnswer: pregunta.respuesta_alumno || 'Sin respuesta',
          teacherComment: pregunta.retroalimentacion || 'Sin comentarios del docente',
          scoreType: this.getScoreType(pregunta.puntaje_obtenido, pregunta.puntaje_maximo),
          puntajeObtenido: pregunta.puntaje_obtenido,
          puntajeMaximo: pregunta.puntaje_maximo
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar la retroalimentación';
        this.isLoading = false;
        console.error('Error cargando retroalimentación:', error);
      }
    });
  }

  getScoreType(puntajeObtenido: number, puntajeMaximo: number): 'full' | 'partial' | 'none' {
    if (puntajeObtenido >= puntajeMaximo) return 'full';
    if (puntajeObtenido > 0) return 'partial';
    return 'none';
  }

  volver() {
    this.router.navigate(['/alumno/resultado', this.evaluationId]);
  }

  getCardClass(scoreType: string): string {
    switch (scoreType) {
      case 'full': return 'feedback-card full-score';
      case 'partial': return 'feedback-card partial-score';
      case 'none': return 'feedback-card no-score';
      default: return 'feedback-card';
    }
  }

  getScoreText(scoreType: string, puntajeObtenido: number, puntajeMaximo: number): string {
    switch (scoreType) {
      case 'full': return `Puntaje completo: ${puntajeObtenido}/${puntajeMaximo}`;
      case 'partial': return `Puntaje parcial: ${puntajeObtenido}/${puntajeMaximo}`;
      case 'none': return `Puntaje: ${puntajeObtenido}/${puntajeMaximo}`;
      default: return `${puntajeObtenido}/${puntajeMaximo}`;
    }
  }
}