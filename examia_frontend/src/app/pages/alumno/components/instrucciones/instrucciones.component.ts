import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instrucciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instrucciones.component.html',
  styleUrls: ['./instrucciones.component.css']
})
export class Instrucciones implements OnInit {
  evaluationId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
  }

  startEvaluation() {
    this.router.navigate(['/alumno/realizar-evaluacion', this.evaluationId]);
  }

  volver() {
    this.router.navigate(['/alumno/evaluaciones']);
  }
}