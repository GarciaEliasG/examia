import { Pregunta } from './pregunta.model';

export class Respuesta {
  id_respuesta!: number;
  id_pregunta!: number;
  contenido!: string;
  calificacion!: number;

  pregunta?: Pregunta;
}

