// models/examen-alumno.model.ts
import { Alumno } from './alumno.model';
import { Examen } from './examen.model';
import { RespuestaAlumno } from './respuesta-alumno.model';

export class ExamenAlumno {
  // ✅ CORREGIDO: Campos REALES que vienen del backend
  id!: number;                    // ← ID principal (PK de Django)
  id_alumno!: number;
  id_examen!: number;
  fecha_inicio!: Date;
  fecha_realizacion!: Date;
  calificacion_final!: number;
  retroalimentacion!: string;
  estado!: 'pendiente' | 'en_progreso' | 'finalizado' | 'corregido' | 'activo';
  tiempo_utilizado!: number;

  // Propiedades para la vista (vienen del serializer personalizado)
  titulo!: string;
  materia!: string;
  docente!: string;
  fecha_limite!: string;
  calificacion?: number;
  descripcion?: string;

  // ✅ Getters para compatibilidad con código existente
  get examen_alumno_id(): number {
    return this.id;
  }
  
  get id_examen_alumno(): number {
    return this.id;
  }

  alumno?: Alumno;
  examen?: Examen;
  respuestas?: RespuestaAlumno[];
}

// ✅ FUNCIONES HELPER CORREGIDAS
export function getIdExamen(evaluacion: ExamenAlumno): number {
  return evaluacion.id_examen ?? 0;
}

export function getIdExamenAlumno(evaluacion: ExamenAlumno): number {
  return evaluacion.id ?? 0;  // ← Usar 'id' que es la PK real
}

export function getEstadoDisplay(estado: string): string {
  switch (estado) {
    case 'activo': return 'Activa';
    case 'pendiente': return 'Entregada';
    case 'corregido': return 'Corregida';
    case 'en_progreso': return 'En progreso';
    case 'finalizado': return 'Finalizada';
    default: return estado;
  }
}

export function getBadgeClass(estado: string): string {
  switch (estado) {
    case 'activo': return 'badge badge-activa';
    case 'pendiente': return 'badge badge-curso';
    case 'corregido': return 'badge badge-corr';
    case 'en_progreso': return 'badge badge-progress';
    case 'finalizado': return 'badge badge-finished';
    default: return 'badge';
  }
}