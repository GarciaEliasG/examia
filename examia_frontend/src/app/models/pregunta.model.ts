// models/pregunta.model.ts
import { Examen } from './examen.model';

export class Pregunta {
  id_pregunta!: number;
  id_examen!: number;
  enunciado!: string;
  tipo!: 'multiple_choice' | 'desarrollo' | 'texto' | 'archivo';
  puntaje!: number;
  opciones?: string[];
  orden!: number;
  es_obligatoria!: boolean;

  examen?: Examen;
}

export class PreguntaWrapper {
  status!: string;
  data!: Pregunta[];
}