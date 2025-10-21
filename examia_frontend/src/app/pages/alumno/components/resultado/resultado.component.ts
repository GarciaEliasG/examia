import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { ExamenAlumnoService } from '../../../../services/examenalumno';

interface QuestionResult {
  id: number;
  tipo: string;
  enunciado: string;
  respuesta_alumno: string;
  puntaje_obtenido: number;
  puntaje_maximo: number;
  estado: 'correct' | 'partial' | 'incorrect';
  retroalimentacion?: string;
}

interface ExamenResultado {
  id: number;
  titulo: string;
  materia: string;
  docente: string;
  fecha_correccion: string;
  tiempo_resolucion: string;
  calificacion_final: number;
  puntaje_maximo: number;
  estado: string;
  preguntas: QuestionResult[];
}

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.css']
})
export class Resultado implements OnInit {
  evaluationId: string = '';
  examen: ExamenResultado | null = null;
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadResults();
  }

  loadResults() {
    this.isLoading = true;
    
    this.evaluacionesService.getResultadoExamen(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        this.examen = {
          id: data.id,
          titulo: data.titulo,
          materia: data.materia,
          docente: data.docente,
          fecha_correccion: data.fecha_correccion || new Date().toISOString(),
          tiempo_resolucion: data.tiempo_resolucion || 'No registrado',
          calificacion_final: data.calificacion_final || 0,
          puntaje_maximo: data.puntaje_maximo || 10,
          estado: data.estado || 'corregido',
          preguntas: this.procesarPreguntas(data.preguntas || [])
        };
        this.isLoading = false;
        
        setTimeout(() => {
          console.log('Resultados cargados:', this.examen);
        }, 100);
      },
      error: (error: any) => {
        this.error = 'Error al cargar los resultados';
        this.isLoading = false;
        console.error('Error cargando resultados:', error);
      }
    });
  }

  procesarPreguntas(preguntas: any[]): QuestionResult[] {
    return preguntas.map(pregunta => {
      let estado: 'correct' | 'partial' | 'incorrect' = 'incorrect';
      
      const puntajeObtenido = pregunta.puntaje_obtenido || 0;
      const puntajeMaximo = pregunta.puntaje_maximo || 1;
      
      if (puntajeObtenido >= puntajeMaximo) {
        estado = 'correct';
      } else if (puntajeObtenido > 0) {
        estado = 'partial';
      } else {
        estado = 'incorrect';
      }
      
      return {
        ...pregunta,
        estado: estado,
        puntaje_obtenido: puntajeObtenido,
        puntaje_maximo: puntajeMaximo
      };
    });
  }

  tieneRetroalimentacion(): boolean {
    const tieneRetro = this.examen?.preguntas?.some(p => 
      p.retroalimentacion && p.retroalimentacion !== 'Sin comentarios del docente'
    ) || false;
    
    console.log('¿Tiene retroalimentación?:', tieneRetro);
    return tieneRetro;
  }

  viewFeedback() {
    if (this.examen) {
      console.log('Navegando a retroalimentación con ID:', this.evaluationId);
      this.router.navigate(['/alumno/retroalimentacion', this.evaluationId]);
    }
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

  getEstadoTexto(calificacion: number, puntajeMaximo: number): string {
    const porcentaje = (calificacion / puntajeMaximo) * 100;
    return porcentaje >= 60 ? 'Aprobado' : 'Desaprobado';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  recargarResultados() {
    this.loadResults();
  }
}