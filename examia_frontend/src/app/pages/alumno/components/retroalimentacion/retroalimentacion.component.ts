import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NgFor } from '@angular/common';
import { NgIf } from '@angular/common';

interface Feedback {
  question: string;
  userAnswer: string;
  teacherComment: string;
  scoreType: 'full' | 'partial' | 'none';
}

@Component({
  selector: 'app-retroalimentacion',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule
  ],
  templateUrl: './retroalimentacion.component.html',
  styleUrls: ['./retroalimentacion.component.css', '../evaluaciones/evaluaciones.component.css', '../resultado/resultado.component.css']
})
export class Retroalimentacion implements OnInit {
  evaluationId: string = '';
  feedbacks: Feedback[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.feedbacks = [
      {
        question: 'Pregunta 1: Células Procariotas',
        userAnswer: 'Sistema de endomembranas',
        teacherComment: '¡Excelente! Esta es la respuesta correcta. Demuestra un claro entendimiento de la estructura celular básica. Sigue así.',
        scoreType: 'full'
      },
      {
        question: 'Pregunta 2: Cromosomas Humanos',
        userAnswer: '23. La mitosis bla bla...',
        teacherComment: 'Tu respuesta es parcialmente correcta. Si bien identificas correctamente el número de pares (23), la explicación sobre la mitosis no es relevante en este contexto y resta claridad a tu argumento principal.',
        scoreType: 'partial'
      },
      {
        question: 'Pregunta 3: Capas de la Atmósfera',
        userAnswer: 'Troposfera, Estratosfera, Ionosfera.',
        teacherComment: 'Falta mencionar la Mesosfera y la Termosfera, que son críticas en el modelo de capas. Revisa el material sobre la estructura completa de la atmósfera terrestre.',
        scoreType: 'none'
      }
    ];
  }

  // Función para volver al resultado
  volver() {
    this.router.navigate(['/alumno/resultado', this.evaluationId]);
  }

  getCardClass(scoreType: string): string {
    switch (scoreType) {
      case 'full': return 'feedback-card';
      case 'partial': return 'feedback-card partial-score';
      case 'none': return 'feedback-card no-score';
      default: return 'feedback-card';
    }
  }
}