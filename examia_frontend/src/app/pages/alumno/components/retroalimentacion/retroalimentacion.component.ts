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
  tipoPregunta?: string;
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
    console.log('Cargando retroalimentación para evaluación ID:', this.evaluationId);
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.isLoading = true;
    this.evaluacionesService.getRetroalimentacionExamen(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        console.log('Datos recibidos de retroalimentación:', data);
        
        this.examenTitulo = data.titulo || 'Retroalimentación';
        this.feedbacks = data.preguntas.map((pregunta: any) => {
          const feedback: Feedback = {
            id: pregunta.id,
            pregunta: pregunta.enunciado,
            userAnswer: pregunta.respuesta_alumno || 'Sin respuesta',
            teacherComment: pregunta.retroalimentacion || 'Sin comentarios del docente',
            scoreType: this.getScoreType(pregunta.puntaje_obtenido, pregunta.puntaje_maximo),
            puntajeObtenido: pregunta.puntaje_obtenido || 0,
            puntajeMaximo: pregunta.puntaje_maximo || 1
          };
          
          if (pregunta.tipo) {
            feedback.tipoPregunta = pregunta.tipo;
          }
          
          return feedback;
        });
        
        this.isLoading = false;
        console.log('Feedbacks procesados:', this.feedbacks);
      },
      error: (error) => {
        this.error = 'Error al cargar la retroalimentación';
        this.isLoading = false;
        console.error('Error cargando retroalimentación:', error);
      }
    });
  }

  getScoreType(puntajeObtenido: number, puntajeMaximo: number): 'full' | 'partial' | 'none' {
    const puntaje = puntajeObtenido || 0;
    const maximo = puntajeMaximo || 1;
    
    if (puntaje >= maximo) return 'full';
    if (puntaje > 0) return 'partial';
    return 'none';
  }

  volver() {
    console.log('Volviendo al resultado con ID:', this.evaluationId);
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
    const puntaje = puntajeObtenido || 0;
    const maximo = puntajeMaximo || 1;
    
    switch (scoreType) {
      case 'full': return `Puntaje completo: ${puntaje}/${maximo}`;
      case 'partial': return `Puntaje parcial: ${puntaje}/${maximo}`;
      case 'none': return `Puntaje: ${puntaje}/${maximo}`;
      default: return `${puntaje}/${maximo}`;
    }
  }

  recargar() {
    this.loadFeedbacks();
  }
}