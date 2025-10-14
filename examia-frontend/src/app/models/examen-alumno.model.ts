import { Alumno } from './alumno.model';
import { Examen } from './examen.model';

export class ExamenAlumno {
  id_examen_alumno!: number;
  id_alumno!: number;
  id_examen!: number;
  fecha_realizacion!: Date;
  calificacion_final!: number;
  retroalimentacion!: string;

  alumno?: Alumno;
  examen?: Examen;
}
