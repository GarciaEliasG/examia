import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteService, DetalleCorreccion, PreguntaCorreccion } from '../../../../services/docente';

@Component({
  selector: 'app-editar-correccion',
  standalone: true,
  imports: [CommonModule, FormsModule,NgIf],
  templateUrl: './editar-correcciones.component.html',
  styleUrls: ['./editar-correcciones.component.css']
})
export class EditarCorreccionComponent implements OnInit {
  
  detalleCorreccion!: DetalleCorreccion;
  loading: boolean = true;
  saving: boolean = false;
  error: string = '';
  success: string = '';

  // Estadísticas en tiempo real
  puntajeTotalActual: number = 0;
  calificacionActual: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    const examenAlumnoId = this.route.snapshot.paramMap.get('id');
    if (examenAlumnoId) {
      this.cargarDetalleCorreccion(parseInt(examenAlumnoId));
    } else {
      this.error = 'ID de examen no válido';
      this.loading = false;
    }
  }

  cargarDetalleCorreccion(examenAlumnoId: number) {
    this.loading = true;
    this.docenteService.getDetalleCorreccion(examenAlumnoId).subscribe({
      next: (data) => {
        this.detalleCorreccion = data;
        this.calcularEstadisticas();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los detalles de la corrección';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  calcularEstadisticas() {
    this.puntajeTotalActual = this.detalleCorreccion.preguntas.reduce(
      (total, pregunta) => total + pregunta.puntaje_actual, 0
    );
    
    if (this.detalleCorreccion.puntaje_maximo_total > 0) {
      this.calificacionActual = (this.puntajeTotalActual / this.detalleCorreccion.puntaje_maximo_total) * 100;
    } else {
      this.calificacionActual = 0;
    }
  }

  onPuntajeChange(pregunta: PreguntaCorreccion, nuevoPuntaje: number) {
    // Validar que no supere el máximo
    if (nuevoPuntaje > pregunta.puntaje_maximo) {
      nuevoPuntaje = pregunta.puntaje_maximo;
    }
    if (nuevoPuntaje < 0) {
      nuevoPuntaje = 0;
    }
    
    pregunta.puntaje_actual = nuevoPuntaje;
    this.calcularEstadisticas();
  }

  guardarCorreccion() {
    this.saving = true;
    this.error = '';
    this.success = '';

    const data = {
      preguntas: this.detalleCorreccion.preguntas.map(p => ({
        respuesta_id: p.respuesta_id,
        puntaje_actual: p.puntaje_actual,
        retroalimentacion_actual: p.retroalimentacion_actual
      })),
      retroalimentacion_general: this.detalleCorreccion.retroalimentacion_general
    };

    this.docenteService.actualizarCorreccion(this.detalleCorreccion.examen_alumno_id, data).subscribe({
      next: (response) => {
        this.success = response.message || 'Corrección guardada exitosamente';
        this.saving = false;
        
        // Actualizar calificación en la vista
        this.detalleCorreccion.calificacion_actual = response.nueva_calificacion;
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/docente/corregir']);
        }, 2000);
      },
      error: (error) => {
        this.error = 'Error al guardar la corrección';
        this.saving = false;
        console.error('Error:', error);
      }
    });
  }

  cancelarEdicion() {
    this.router.navigate(['/docente/corregir']);
  }

  getColorCalificacion(calificacion: number): string {
    if (calificacion >= 80) return 'excelente';
    if (calificacion >= 60) return 'bueno';
    if (calificacion >= 40) return 'regular';
    return 'insuficiente';
  }

  volverALista() {
    this.router.navigate(['/docente/corregir']);
  }
}