import { Alumno } from './alumno.model';
import { Curso } from './curso.model';

export class Inscripcion {
  id_inscripcion!: number;
  id_alumno!: number;
  id_curso!: number;
  fecha_inscripcion!: Date;

  
    alumno?: Alumno;
    curso?: Curso;
}
