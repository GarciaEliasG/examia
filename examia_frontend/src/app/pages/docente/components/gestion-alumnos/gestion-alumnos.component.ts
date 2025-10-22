import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

// --- Definimos Interfaces para un código más limpio y seguro ---
interface Alumno {
  id: number;
  nombre: string;
  evaluaciones: { [key: string]: string }; // ej: { "Evaluación 1": "Aprobado" }
}

interface Curso {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-gestion-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-alumnos.component.html',
  styleUrls: ['./gestion-alumnos.component.css'] // Asumo que tienes un CSS con este nombre
})
export class GestionAlumnos implements OnInit {

  // --- PROPIEDADES PARA EL ESTADO DEL COMPONENTE ---

  // Listas de datos
  cursos: Curso[] = [];
  alumnos: Alumno[] = [];
  alumnosFiltrados: Alumno[] = [];
  titulosEvaluaciones: string[] = []; // Para las cabeceras de la tabla

  // Estado de los filtros y búsquedas
  cursoSeleccionadoId: number = 0; // 0 para "Todos los cursos"
  
  // Control de modales
  modalCursoVisible: boolean = false;
  modalAgregarAlumnoVisible: boolean = false;
  modalImportarVisible: boolean = false;
  
  // Control de notificaciones
  toastVisible: boolean = false;
  toastMessage: string = '';

  constructor() { }

  ngOnInit(): void {
    // Cargamos los datos iniciales cuando el componente se inicia
    this.cargarDatos();
    this.filtrarAlumnos(); // Mostramos la lista inicial
  }
  
  // --- MÉTODOS PARA CARGAR Y MANIPULAR DATOS ---

  cargarDatos(): void {
    // En una app real, esto vendría de un servicio/API. Por ahora, usamos datos de ejemplo.
    this.cursos = [
      { id: 1, nombre: '1° Año' },
      { id: 2, nombre: '2° Año' },
    ];

    this.alumnos = [
      { id: 1, nombre: 'Ana García', evaluaciones: { 'Evaluación Unidad 1': 'Aprobado', 'Evaluación Unidad 2': 'Desaprobado' } },
      { id: 2, nombre: 'Juan Pérez', evaluaciones: { 'Evaluación Unidad 1': 'Aprobado', 'Evaluación Unidad 2': 'Aprobado' } },
    ];
    
    // Extraemos los títulos de las evaluaciones para las columnas de la tabla
    const todosLosTitulos = this.alumnos.flatMap(a => Object.keys(a.evaluaciones));
    this.titulosEvaluaciones = [...new Set(todosLosTitulos)]; // Usamos Set para obtener títulos únicos
  }

  filtrarAlumnos(): void {
    // La lógica de filtrado ahora vive aquí
    if (this.cursoSeleccionadoId === 0) {
      this.alumnosFiltrados = this.alumnos;
    } else {
      // Aquí necesitarías una lógica para asociar alumnos a cursos.
      // Como los datos de ejemplo no lo tienen, por ahora mostramos todos.
      this.alumnosFiltrados = this.alumnos; 
    }
  }

  // --- MÉTODOS PARA MANEJAR MODALES ---

  abrirModal(tipo: 'curso' | 'agregar' | 'importar'): void {
    if (tipo === 'curso') this.modalCursoVisible = true;
    if (tipo === 'agregar') this.modalAgregarAlumnoVisible = true;
    if (tipo === 'importar') this.modalImportarVisible = true;
  }
  
  cerrarModal(tipo: 'curso' | 'agregar' | 'importar'): void {
    if (tipo === 'curso') this.modalCursoVisible = false;
    if (tipo === 'agregar') this.modalAgregarAlumnoVisible = false;
    if (tipo === 'importar') this.modalImportarVisible = false;
  }
  
  // --- MÉTODOS PARA ACCIONES ---

  agregarCurso(nombreCurso: string): void {
    // Lógica para agregar un nuevo curso...
    console.log('Agregando curso:', nombreCurso);
    this.cerrarModal('curso');
    this.mostrarToast(`Curso "${nombreCurso}" creado.`);
  }

  exportarEvaluacion(tituloEvaluacion: string): void {
    if (!tituloEvaluacion) return;

    const filas = [['Alumno', tituloEvaluacion]]; // Cabecera del CSV
    
    this.alumnosFiltrados.forEach(alumno => {
      const nota = alumno.evaluaciones[tituloEvaluacion] || 'N/A';
      filas.push([alumno.nombre, nota]);
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + filas.map(e => e.join(";")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `notas_${tituloEvaluacion.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- MÉTODO PARA NOTIFICACIONES ---

  mostrarToast(mensaje: string): void {
    this.toastMessage = mensaje;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000); // El toast desaparece después de 3 segundos
  }
}