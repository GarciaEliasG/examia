import { Pregunta } from './pregunta.model';

export class Respuesta {
  id_respuesta!: number;
  pregunta_id!: number;
  contenido!: string;
  calificacion!: number;

  pregunta?: Pregunta;
}

