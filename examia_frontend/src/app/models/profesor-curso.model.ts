import { Profesor } from './profesor.model';
import { Curso } from './curso.model';

export class ProfesorCurso {
  id_profesor_curso!: number;
  id_curso!: number;
  id_profesor!: number;
  rol!: string;

  profesor?: Profesor;
  curso?: Curso;
}
