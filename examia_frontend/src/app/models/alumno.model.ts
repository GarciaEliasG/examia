export class Alumno {
  id_alumno!: number;
  nombre!: string;
  email!: string;
  contraseña!: string;
}

export class AlumnoWrapper {
  status!: string;
  data!: Alumno[];
}
