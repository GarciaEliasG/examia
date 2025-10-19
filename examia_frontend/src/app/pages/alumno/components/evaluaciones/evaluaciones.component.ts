import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModel } from '@angular/forms';
import { NgFor } from '@angular/common';
import { NgIf } from '@angular/common';

interface Evaluation {
  id: number;
  title: string;
  subject: string;
  teacher: string;
  duration: string;
  date: string;
  deadline: string;
  status: 'activa' | 'en-curso' | 'entregada' | 'corregida';
  progress?: string;
  grade?: string;
  hasFeedback: boolean;
}

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule,NgFor],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.css']
})
export class Evaluaciones {
  searchTerm: string = '';
  selectedSubject: string = '';
  selectedStatus: string = '';
  selectedSort: string = '';

  evaluations: Evaluation[] = [
    {
      id: 1,
      title: 'Parcial 1',
      subject: 'Matemática I',
      teacher: 'Prof. García',
      duration: '45 min',
      date: '25/10 18:00 – 19:00',
      deadline: '19:15',
      status: 'activa',
      hasFeedback: false
    },
    {
      id: 2,
      title: 'Laboratorio – TP Corto',
      subject: 'Química',
      teacher: 'Lic. De Cia',
      duration: '30 min',
      date: 'Guardado hace 10 min',
      deadline: '',
      status: 'en-curso',
      progress: '20 min',
      hasFeedback: false
    },
    {
      id: 3,
      title: 'Práctico 2',
      subject: 'Programación',
      teacher: 'Ing. Badino',
      duration: '60 min',
      date: 'Entregado: 10/10 21:34',
      deadline: '',
      status: 'entregada',
      hasFeedback: false
    },
    {
      id: 4,
      title: 'Parcial Integrador',
      subject: 'Matemática I',
      teacher: 'Prof. García',
      duration: '90 min',
      date: 'Corregido: 15/10/2025',
      deadline: '',
      status: 'corregida',
      grade: '8.50',
      hasFeedback: true
    }
  ];

  showDiscardModal = false;
  showFinishedModal = false;
  selectedEvaluation?: Evaluation;

  constructor(private router: Router) {}

  get filteredEvaluations(): Evaluation[] {
    return this.evaluations.filter(evalu => {
      const matchesSearch = !this.searchTerm || 
        evalu.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        evalu.subject.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesSubject = !this.selectedSubject || evalu.subject === this.selectedSubject;
      const matchesStatus = !this.selectedStatus || evalu.status === this.selectedStatus;
      
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }

  takeEvaluation(evaluation: Evaluation) {
    if (evaluation.status === 'entregada' || evaluation.status === 'corregida') {
      this.selectedEvaluation = evaluation;
      this.showFinishedModal = true;
    } else {
      this.router.navigate(['/alumno/realizar-evaluacion', evaluation.id]);
    }
  }

  viewInstructions(evaluation: Evaluation) {
    this.router.navigate(['/alumno/instrucciones', evaluation.id]);
  }

  viewSubmission(evaluation: Evaluation) {
    this.router.navigate(['/alumno/envio', evaluation.id]);
  }

  viewResult(evaluation: Evaluation) {
    this.router.navigate(['/alumno/resultado', evaluation.id]);
  }

  viewFeedback(evaluation: Evaluation) {
    this.router.navigate(['/alumno/resultado', evaluation.id]);
  }

  continueEvaluation(evaluation: Evaluation) {
    this.router.navigate(['/alumno/realizar-evaluacion', evaluation.id]);
  }

  openDiscardModal(evaluation: Evaluation) {
    this.selectedEvaluation = evaluation;
    this.showDiscardModal = true;
  }

  discardAttempt() {
    // Lógica para descartar intento
    console.log('Descartando intento de:', this.selectedEvaluation?.title);
    this.showDiscardModal = false;
  }

  closeModals() {
    this.showDiscardModal = false;
    this.showFinishedModal = false;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'activa': return 'badge badge-activa';
      case 'en-curso': return 'badge badge-curso';
      case 'corregida': return 'badge badge-corr';
      default: return 'badge';
    }
  }
}