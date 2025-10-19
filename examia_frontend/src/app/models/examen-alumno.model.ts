// models/examen-alumno.model.ts
import { Alumno } from './alumno.model';
import { Examen } from './examen.model';
import { RespuestaAlumno } from './respuesta-alumno.model';

export class ExamenAlumno {
  // ✅ CAMPOS EXISTENTES - SE MANTIENEN EXACTAMENTE IGUAL
  id_examen_alumno!: number;
  id_alumno!: number;
  id_examen!: number;
  fecha_inicio!: Date;
  fecha_realizacion!: Date;
  calificacion_final!: number;
  retroalimentacion!: string;
  estado!: 'pendiente' | 'en_progreso' | 'finalizado' | 'corregido' | 'activo';
  tiempo_utilizado!: number;
  intento_numero!: number;

  // Propiedades para la vista
  titulo!: string;
  materia!: string;
  docente!: string;
  fecha_limite!: string;
  calificacion?: number;
  descripcion?: string;
  preguntas_count?: number;
  duracion_minutos?: number;
  intento_unico?: boolean;

  alumno?: Alumno;
  examen?: Examen;
  respuestas?: RespuestaAlumno[];

  // ✅ NUEVOS CAMPOS OPCIONALES PARA COMPATIBILIDAD CON BACKEND ACTUALIZADO
  id?: number;                          // Para compatibilidad con código existente
  id_examen_base?: number;              // Alias para id_examen (si es necesario)
  examen_alumno_id?: number;            // Alias para id_examen_alumno (compatibilidad)
}

// ✅ FUNCIONES HELPER PARA MANTENER COMPATIBILIDAD
export function getIdExamen(evaluacion: ExamenAlumno): number {
  // Prioridad: id_examen -> id_examen_base -> id (para compatibilidad)
  return evaluacion.id_examen ?? evaluacion.id_examen_base ?? evaluacion.id ?? 0;
}

export function getIdExamenAlumno(evaluacion: ExamenAlumno): number {
  // Prioridad: id_examen_alumno -> examen_alumno_id -> id (para compatibilidad)
  return evaluacion.id_examen_alumno ?? evaluacion.examen_alumno_id ?? evaluacion.id ?? 0;
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