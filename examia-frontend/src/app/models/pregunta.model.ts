import { Examen } from './examen.model';

export class Pregunta {
  id_pregunta!: number;
  id_examen!: number;
  enunciado!: string;
  tipo!: string;
  puntaje!: number;

  examen?: Examen;
}
export class PreguntaWrapper {
  status!: string;
  data!: Pregunta[];
}