import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteService, MetricasCurso } from '../../../../services/docente';

@Component({
  selector: 'app-metricas-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metricas-curso.component.html',
  styleUrls: ['./metricas-curso.component.css']
})
export class MetricasCursoComponent implements OnInit {
  
  metricas: MetricasCurso | null = null;
  loading: boolean = true;
  error: string = '';
  cursoId: number = 0;

  // Filtros para gráficos
  filtroExamen: number | 'all' = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarMetricas();
  }

  cargarMetricas() {
    this.loading = true;
    this.error = '';
    
    this.docenteService.getMetricasCurso(this.cursoId).subscribe({
      next: (data) => {
        this.metricas = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar las métricas del curso';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  volverACursos() {
    this.router.navigate(['/docente/cursos']);
  }

  navegarAAlumnos() {
    this.router.navigate(['/docente/cursos', this.cursoId, 'alumnos']);
  }

  // Métodos utilitarios para la vista
  getColorCalificacion(calificacion: number): string {
    return this.docenteService.getColorCalificacion(calificacion);
  }

  formatearPorcentaje(valor: number, total: number): string {
    return this.docenteService.formatearPorcentaje(valor, total);
  }

  getMetricasFiltradas() {
    if (this.filtroExamen === 'all' || !this.metricas) {
      return this.metricas?.metricas_examenes || [];
    }
    return this.metricas.metricas_examenes.filter(examen => 
      examen.examen_id === this.filtroExamen
    );
  }

  recargar() {
    this.cargarMetricas();
  }
}