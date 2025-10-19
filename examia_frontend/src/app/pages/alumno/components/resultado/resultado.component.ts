import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface QuestionResult {
  id: number;
  type: string;
  text: string;
  userAnswer: string;
  score: string;
  status: 'correct' | 'partial' | 'incorrect';
}

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.css']
})
export class Resultado implements OnInit {
  evaluationId: string = '';
  questions: QuestionResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadResults();
  }

  loadResults() {
    this.questions = [
      {
        id: 1,
        type: 'MC',
        text: 'Pregunta 1: Las células procariotas no poseen:',
        userAnswer: 'Sistema de endomembranas',
        score: '1.00 / 1.00',
        status: 'correct'
      },
      {
        id: 2,
        type: 'Desarrollo',
        text: 'Pregunta 2: ¿Cuántos pares de cromosomas tiene un ser humano...?',
        userAnswer: '23. La mitosis bla bla...',
        score: '0.50 / 1.00',
        status: 'partial'
      },
      {
        id: 3,
        type: 'Desarrollo',
        text: 'Pregunta 3: Menciona las capas de la atmósfera.',
        userAnswer: 'Troposfera, Estratosfera, Ionosfera.',
        score: '0.00 / 1.00',
        status: 'incorrect'
      }
    ];
  }

  viewFeedback() {
    this.router.navigate(['/alumno/retroalimentacion', this.evaluationId]);
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
}