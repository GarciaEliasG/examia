import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExamenAlumnoService } from '../../../../services/examenalumno';
import { ExamenAlumno } from '../../../../models/examen-alumno.model';

interface Attachment {
  name: string;
  type: string;
  downloadUrl: string;
}

interface PreguntaEnvio {
  id: number;
  enunciado: string;
  tipo: string;
  respuesta: string;
  opcionSeleccionada?: number;
}

interface ExamenEnvio {
  id: number;
  titulo: string;
  materia: string;
  docente: string;
  fecha_realizacion: string;
  estado: string;
  preguntas: PreguntaEnvio[];
}

@Component({
  selector: 'app-envio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './envio.component.html',
  styleUrls: ['./envio.component.css','../evaluaciones/evaluaciones.component.css']
})
export class Envio implements OnInit {
  evaluationId: string = '';
  examen: ExamenEnvio | null = null;
  attachments: Attachment[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: ExamenAlumnoService
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEnvioData();
  }

  loadEnvioData() {
    this.isLoading = true;
    this.evaluacionesService.getEnvioDetalle(parseInt(this.evaluationId)).subscribe({
      next: (data: any) => {
        this.examen = {
          id: data.examen.id,
          titulo: data.examen.titulo,
          materia: data.materia || 'Sin materia',
          docente: data.docente || 'Sin docente',
          fecha_realizacion: data.fecha_realizacion || new Date().toISOString(),
          estado: data.estado || 'pendiente',
          preguntas: data.preguntas || []
        };
        
        // Cargar archivos adjuntos si existen
        this.loadAttachments();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos del envío';
        this.isLoading = false;
        console.error('Error cargando envío:', error);
      }
    });
  }

  loadAttachments() {
    // Simular archivos adjuntos - en una implementación real vendrían del backend
    this.attachments = [
      { name: 'documento_final.pdf', type: 'pdf', downloadUrl: '#' },
      { name: 'diagrama_clases.png', type: 'image', downloadUrl: '#' }
    ];
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      default: return '📎';
    }
  }

  getTipoPregunta(tipo: string): string {
    const tipos: {[key: string]: string} = {
      'multiple_choice': 'Opción Múltiple',
      'desarrollo': 'Desarrollo',
      'texto': 'Texto',
      'archivo': 'Archivo'
    };
    return tipos[tipo] || tipo;
  }

  volver() {
    this.router.navigate(['/alumno/evaluaciones']);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}