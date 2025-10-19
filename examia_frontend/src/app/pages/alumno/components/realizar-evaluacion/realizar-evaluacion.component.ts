import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  type: 'multiple-choice' | 'text' | 'file';
  title: string;
  text: string;
  options?: string[];
  answer?: any;
  saved: boolean;
}

@Component({
  selector: 'app-realizar-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './realizar-evaluacion.component.html',
  styleUrls: ['./realizar-evaluacion.component.css']
})
export class RealizarEvaluacion implements OnInit {
  evaluationId: string = '';
  timeLeft: number = 30 * 60; // 30 minutos en segundos
  questions: Question[] = [];
  
  showIncompleteWarning = false;
  showTimeUpModal = false;
  showSuccessModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.initializeQuestions();
    this.startTimer();
  }

  initializeQuestions() {
    this.questions = [
      {
        id: 1,
        type: 'multiple-choice',
        title: 'Pregunta 1:',
        text: 'Las células procariotas no poseen:',
        options: ['Sistema de endomembranas', 'ARN', 'ADN', 'Ribosomas'],
        saved: false
      },
      {
        id: 2,
        type: 'text',
        title: 'Pregunta 2:',
        text: '¿Cuántos pares de cromosomas tiene un ser humano en sus células somáticas normales?',
        saved: false
      },
      {
        id: 3,
        type: 'file',
        title: 'Pregunta 3 (Opcional):',
        text: 'Adjunta una imagen del experimento realizado. (Opcional)',
        saved: false
      }
    ];
  }

  startTimer() {
    const timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(timer);
        this.showTimeUpModal = true;
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  saveAnswer(question: Question) {
    question.saved = true;
    // Aquí iría la lógica para guardar en backend
    console.log('Respuesta guardada:', question);
  }

  editAnswer(question: Question) {
    question.saved = false;
  }

  hasUnsavedAnswers(): boolean {
    return this.questions.some(q => !q.saved && q.type !== 'file');
  }

  submitEvaluation() {
    if (this.hasUnsavedAnswers()) {
      this.showIncompleteWarning = true;
    } else {
      this.finalizeSubmission();
    }
  }

  confirmSubmission() {
    this.showIncompleteWarning = false;
    this.finalizeSubmission();
  }

  finalizeSubmission() {
    // Lógica para enviar evaluación al backend
    this.showSuccessModal = true;
  }

  closeModals() {
    this.showIncompleteWarning = false;
    this.showTimeUpModal = false;
    this.showSuccessModal = false;
  }

  returnToPanel() {
    this.router.navigate(['/alumno/panel']);
  }
}