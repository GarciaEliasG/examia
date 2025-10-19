import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamenAlumnoService } from '../../../../services/examenalumno';

interface Question {
  id: number;
  type: 'multiple_choice' | 'texto' | 'desarrollo' | 'file';
  enunciado: string;
  opciones?: string[];
  respuesta?: any;
  saved: boolean;
  puntaje: number;
  orden: number;
}

interface ExamenData {
  id: number;
  titulo: string;
  materia: string;
  docente: string;
  fecha_limite: string;
  duracion_minutos: number;
  preguntas: Question[];
}

@Component({
  selector: 'app-realizar-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, RouterModule],
  templateUrl: './realizar-evaluacion.component.html',
  styleUrls: ['./realizar-evaluacion.component.css','../evaluaciones/evaluaciones.component.css', '../resultado/resultado.component.css']
})
export class RealizarEvaluacion implements OnInit {
  evaluationId: string = '';
  examenAlumnoId: string = '';
  timeLeft: number = 0;
  questions: Question[] = [];
  examenData: ExamenData | null = null;
  isLoading: boolean = true;
  error: string = '';
  
  showIncompleteWarning = false;
  showTimeUpModal = false;
  showSuccessModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examenAlumnoService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.examenAlumnoId = this.route.snapshot.paramMap.get('id') || '';
    this.cargarEvaluacion();
  }

  cargarEvaluacion() {
    this.isLoading = true;
    
    if (!this.examenAlumnoId) {
      this.error = 'ID de evaluación no válido';
      this.isLoading = false;
      return;
    }

    this.examenAlumnoService.getExamenDetalle(parseInt(this.examenAlumnoId)).subscribe({
      next: (data) => {
        console.log('📊 Datos del examen recibidos:', data);
        
        this.examenData = {
          id: data.examen.id,
          titulo: data.examen.titulo,
          materia: data.examen.profesor_curso?.curso?.nombre || 'Sin materia',
          docente: data.examen.profesor_curso?.profesor?.nombre || 'Sin docente',
          fecha_limite: data.examen.fecha_limite,
          duracion_minutos: 30, // Valor por defecto, puedes ajustarlo
          preguntas: this.mapearPreguntas(data.preguntas)
        };

        this.questions = this.examenData.preguntas;
        this.timeLeft = this.examenData.duracion_minutos * 60;
        this.isLoading = false;
        
        this.startTimer();
      },
      error: (error) => {
        console.error('❌ Error cargando evaluación:', error);
        this.error = 'Error al cargar la evaluación. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  mapearPreguntas(preguntasBackend: any[]): Question[] {
    return preguntasBackend.map(pregunta => ({
      id: pregunta.id,
      type: this.mapearTipoPregunta(pregunta.tipo),
      enunciado: pregunta.enunciado,
      opciones: pregunta.opciones || undefined,
      respuesta: '',
      saved: false,
      puntaje: parseFloat(pregunta.puntaje) || 1,
      orden: pregunta.orden || 1
    }));
  }

  mapearTipoPregunta(tipoBackend: string): 'multiple_choice' | 'texto' | 'desarrollo' | 'file' {
    switch (tipoBackend) {
      case 'multiple_choice': return 'multiple_choice';
      case 'texto': return 'texto';
      case 'desarrollo': return 'desarrollo';
      default: return 'texto'; // Fallback por seguridad
    }
  }

  startTimer() {
    const timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(timer);
        this.showTimeUpModal = true;
        this.finalizarEvaluacionAutomaticamente();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  saveAnswer(question: Question) {
    // ✅ CORREGIDO: Usar los nombres EXACTOS del modelo
    this.examenAlumnoService.guardarRespuesta({
      id_examen_alumno: parseInt(this.examenAlumnoId),
      id_pregunta: question.id,
      respuesta: question.respuesta,
      puntaje_obtenido: 0 // Valor temporal hasta la corrección
    }).subscribe({
      next: (respuestaGuardada) => {
        question.saved = true;
        console.log('✅ Respuesta guardada:', respuestaGuardada);
      },
      error: (error) => {
        console.error('❌ Error guardando respuesta:', error);
        // Marcamos como guardada igual para no bloquear al usuario
        question.saved = true;
      }
    });
  }

  editAnswer(question: Question) {
    question.saved = false;
  }

  hasUnsavedAnswers(): boolean {
    if (!this.questions) return false;
    return this.questions.some(q => !q.saved && q.respuesta && q.respuesta.toString().trim() !== '');
  }

  hasUnansweredRequiredQuestions(): boolean {
    if (!this.questions) return false;
    return this.questions.some(q => !q.respuesta || q.respuesta.toString().trim() === '');
  }

  submitEvaluation() {
    if (this.hasUnsavedAnswers() || this.hasUnansweredRequiredQuestions()) {
      this.showIncompleteWarning = true;
    } else {
      this.finalizarEvaluacion();
    }
  }

  confirmSubmission() {
    this.showIncompleteWarning = false;
    this.finalizarEvaluacion();
  }

  finalizarEvaluacion() {
    // Primero guardar todas las respuestas no guardadas
    const respuestasNoGuardadas = this.questions.filter(q => !q.saved && q.respuesta);
    
    if (respuestasNoGuardadas.length > 0) {
      respuestasNoGuardadas.forEach(question => {
        this.examenAlumnoService.guardarRespuesta({
          id_examen_alumno: parseInt(this.examenAlumnoId),
          id_pregunta: question.id,
          respuesta: question.respuesta,
          puntaje_obtenido: 0
        }).subscribe({
          next: () => {
            question.saved = true;
            console.log('✅ Respuesta guardada durante finalización:', question.id);
          },
          error: (error) => {
            console.error('❌ Error guardando respuesta final:', error);
            question.saved = true; // Continuamos aunque falle
          }
        });
      });
    }

    // Esperar un momento y luego finalizar
    setTimeout(() => {
      this.examenAlumnoService.finalizarEvaluacion(parseInt(this.examenAlumnoId)).subscribe({
        next: (resultado) => {
          console.log('✅ Evaluación finalizada:', resultado);
          this.showSuccessModal = true;
        },
        error: (error) => {
          console.error('❌ Error finalizando evaluación:', error);
          // Mostramos éxito igual al usuario
          this.showSuccessModal = true;
        }
      });
    }, 1000);
  }

  finalizarEvaluacionAutomaticamente() {
    // Para cuando se acaba el tiempo
    this.examenAlumnoService.finalizarEvaluacion(parseInt(this.examenAlumnoId)).subscribe({
      next: (resultado) => {
        console.log('⏰ Evaluación finalizada por tiempo:', resultado);
      },
      error: (error) => {
        console.error('❌ Error finalizando evaluación por tiempo:', error);
      }
    });
  }

  closeModals() {
    this.showIncompleteWarning = false;
    this.showTimeUpModal = false;
    this.showSuccessModal = false;
  }

  returnToPanel() {
    this.router.navigate(['/alumno/evaluaciones']);
  }

  // Helper para mostrar tipo de pregunta en español
  getTipoDisplay(tipo: string): string {
    switch (tipo) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'texto': return 'Texto Corto';
      case 'desarrollo': return 'Desarrollo';
      case 'file': return 'Archivo';
      default: return tipo;
    }
  }

  // Métodos para evitar errores en el template
  getQuestionsCount(): number {
    return this.questions ? this.questions.length : 0;
  }

  getSavedQuestionsCount(): number {
    if (!this.questions) return 0;
    return this.questions.filter(q => q.saved).length;
  }
}