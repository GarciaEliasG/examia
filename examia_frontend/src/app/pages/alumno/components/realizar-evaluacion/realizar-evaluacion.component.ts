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
  examenAlumnoId: string = '';  // ID del ExamenAlumno (para guardar respuestas)
  examenId: string = '';        // ID del Examen base (para cargar detalles)
  timeLeft: number = 0;
  questions: Question[] = [];
  examenData: ExamenData | null = null;
  isLoading: boolean = true;
  error: string = '';
  
  showIncompleteWarning = false;
  showTimeUpModal = false;
  showSuccessModal = false;
  isSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examenAlumnoService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.examenId = this.route.snapshot.paramMap.get('id') || '';
    console.log('🆔 Examen ID cargado desde URL:', this.examenId);
    
    if (!this.examenId) {
      this.error = 'ID de examen no válido';
      this.isLoading = false;
      return;
    }

    // 1. Primero INICIAR la evaluación para crear ExamenAlumno
    this.iniciarEvaluacion(parseInt(this.examenId));
  }

  iniciarEvaluacion(examenId: number) {
    this.isLoading = true;
    console.log('🚀 Iniciando evaluación para examen ID:', examenId);
    
    this.examenAlumnoService.iniciarEvaluacion(examenId).subscribe({
      next: (data) => {
        console.log('✅ Evaluación iniciada:', data);
        
        // ✅ Este es el ID CORRECTO para guardar respuestas
        this.examenAlumnoId = data.examen_alumno_id.toString();
        console.log('🎯 ExamenAlumno ID asignado:', this.examenAlumnoId);
        
        // 2. Ahora cargar el detalle del examen
        this.cargarDetalleExamen(examenId);
      },
      error: (error) => {
        console.error('❌ Error iniciando evaluación:', error);
        this.error = 'Error al iniciar la evaluación. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  cargarDetalleExamen(examenId: number) {
    console.log('📊 Cargando detalle del examen ID:', examenId);
    
    this.examenAlumnoService.getExamenDetalle(examenId).subscribe({
      next: (data) => {
        console.log('📋 Datos del examen recibidos:', data);
        
        this.examenData = {
          id: data.examen.id,
          titulo: data.examen.titulo,
          materia: data.examen.profesor_curso?.curso?.nombre || 'Sin materia',
          docente: data.examen.profesor_curso?.profesor?.nombre || 'Sin docente',
          fecha_limite: data.examen.fecha_limite,
          duracion_minutos: data.examen.duracion_minutos || 30,
          preguntas: this.mapearPreguntas(data.preguntas)
        };

        this.questions = this.examenData.preguntas;
        this.timeLeft = this.examenData.duracion_minutos * 60;
        this.isLoading = false;
        
        console.log('⏰ Tiempo asignado:', this.timeLeft, 'segundos');
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
      default: return 'texto';
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
    if (!this.examenAlumnoId) {
      console.error('❌ No hay examenAlumnoId para guardar respuesta');
      return;
    }

    console.log('💾 Guardando respuesta para pregunta:', question.id);
    
    this.examenAlumnoService.guardarRespuesta({
      examen_alumno_id: parseInt(this.examenAlumnoId),
      pregunta_id: question.id,
      respuesta: question.respuesta,
      puntaje_obtenido: 0
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
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    console.log('🚀 Iniciando finalización de evaluación...');

    const respuestasNoGuardadas = this.questions.filter(q => !q.saved && q.respuesta);
  
    if (respuestasNoGuardadas.length > 0) {
      console.log(`💾 Guardando ${respuestasNoGuardadas.length} respuestas pendientes...`);
    
      const guardarPromesas = respuestasNoGuardadas.map(question => {
        return new Promise<void>((resolve) => {
          this.examenAlumnoService.guardarRespuesta({
            examen_alumno_id: parseInt(this.examenAlumnoId),
            pregunta_id: question.id,
            respuesta: question.respuesta,
            puntaje_obtenido: 0
          }).subscribe({
            next: () => {
              question.saved = true;
              console.log('✅ Respuesta guardada durante finalización:', question.id);
              resolve();
            },
            error: (error) => {
              console.error('❌ Error guardando respuesta final:', error);
              question.saved = true;
              resolve();
            }
          });
        });
      });

      Promise.all(guardarPromesas).then(() => {
        this.ejecutarFinalizacion();
      });
    } else {
      this.ejecutarFinalizacion();
    }
  }

  private ejecutarFinalizacion() {
    console.log('🎯 Ejecutando finalización con ExamenAlumno ID:', this.examenAlumnoId);
    
    this.examenAlumnoService.finalizarEvaluacion(parseInt(this.examenAlumnoId)).subscribe({
      next: (resultado) => {
        console.log('✅ Evaluación finalizada exitosamente:', resultado);
        this.showSuccessModal = true;
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error finalizando evaluación:', error);
        
        if (error.status === 404) {
          this.error = 'Error: No se encontró la evaluación. Verifica el ID.';
        } else {
          this.error = `Error al finalizar: ${error.message}`;
        }
        
        this.isSubmitting = false;
        // Mostramos éxito igual al usuario para no bloquearlo
        this.showSuccessModal = true;
      }
    });
  }

  finalizarEvaluacionAutomaticamente() {
    console.log('⏰ Finalizando evaluación automáticamente por tiempo');
    this.examenAlumnoService.finalizarEvaluacion(parseInt(this.examenAlumnoId)).subscribe({
      next: (resultado) => {
        console.log('✅ Evaluación finalizada por tiempo:', resultado);
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

  getTipoDisplay(tipo: string): string {
    switch (tipo) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'texto': return 'Texto Corto';
      case 'desarrollo': return 'Desarrollo';
      case 'file': return 'Archivo';
      default: return tipo;
    }
  }

  getQuestionsCount(): number {
    return this.questions ? this.questions.length : 0;
  }

  getSavedQuestionsCount(): number {
    if (!this.questions) return 0;
    return this.questions.filter(q => q.saved).length;
  }

  reiniciarEvaluacion() {
    this.iniciarEvaluacion(parseInt(this.examenId));
}
}