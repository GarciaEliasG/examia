// models/examen.model.ts
import { ProfesorCurso } from './profesor-curso.model';
import { Pregunta } from './pregunta.model';

export class Examen {
  id_examen!: number;
  id_profesor_curso!: number;
  titulo!: string;
  descripcion!: string;
  fecha_creacion!: Date;
  fecha_limite!: Date;
  duracion_minutos!: number;
  intento_unico!: boolean;
  estado!: 'activo' | 'inactivo';
  instrucciones?: string;

  profesorCurso?: ProfesorCurso;
  preguntas?: Pregunta[];
}

export class ExamenWrapper {
  status!: string;
  data!: Examen[];
}