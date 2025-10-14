export class Curso {
  id_curso!: number;
  nombre!: string;
  descripcion!: string;
}
export class CursoWrapper {
  status!: string;
  data!: Curso[];
}