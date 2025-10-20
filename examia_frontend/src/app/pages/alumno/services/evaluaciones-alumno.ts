export interface ExamenAlumno {
  id_examen: number;           // ID del examen base
  examen_alumno_id: number | null;    // ID de la relación alumno-examen (null para activos)
  titulo: string;
  descripcion: string;
  materia: string;
  docente: string;
  fecha_limite: string | Date | null;
  estado: 'activo' | 'pendiente' | 'corregido';
  calificacion: number | null;
  fecha_creacion: string | Date;
  fecha_realizacion: string | Date | null;
  retroalimentacion: string;
}