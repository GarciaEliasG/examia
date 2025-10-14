import { ExamenAlumno } from './examen-alumno.model';

export class RespuestaAlumno {
  id_respuesta_alumno!: number;
  id_examen_alumno!: number;
  pregunta!: string;
  respuesta!: string;
  puntaje_obtenido!: number;

  examenAlumno?: ExamenAlumno;
}
