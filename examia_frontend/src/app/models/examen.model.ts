import { ProfesorCurso } from './profesor-curso.model';

export class Examen {
  id_examen!: number;
  id_profesor_curso!: number;
  titulo!: string;
  descripcion!: string;
  fecha_creacion!: Date;
  fecha_limite!: Date;

  profesorCurso?: ProfesorCurso;
}

export class ExamenWrapper {
  status!: string;
  data!: Examen[];
}
