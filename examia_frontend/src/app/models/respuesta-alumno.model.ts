// models/respuesta-alumno.model.ts
import { ExamenAlumno } from './examen-alumno.model';
import { Pregunta } from './pregunta.model';

export class RespuestaAlumno {
  id_respuesta_alumno!: number;
  id_examen_alumno!: number;
  id_pregunta!: number;
  respuesta!: string;
  respuesta_opcion?: number;
  archivo_url?: string;
  archivo_nombre?: string;
  puntaje_obtenido!: number;
  retroalimentacion?: string;
  fecha_respuesta?: Date;

  examenAlumno?: ExamenAlumno;
  pregunta?: Pregunta;
}