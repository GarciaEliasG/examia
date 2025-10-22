import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- 1. Importa FormsModule para ngModel
import { Router, RouterModule } from '@angular/router'; // <-- 2. Importa Router para navegar

// Definimos una interfaz para tipar nuestras evaluaciones y tener mejor autocompletado
interface Evaluacion {
  id: string;
  titulo: string;
  estado: 'borrador' | 'publicada';
  fecha: string;
  preguntas: number;
}

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- 3. Agrégalo a los imports
    RouterModule
  ],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.css']
})
export class Evaluaciones implements OnInit {

  // --- PROPIEDADES PARA MANEJAR EL ESTADO ---
  
  // Lista original de evaluaciones
  listaCompleta: Evaluacion[] = [];
  // Lista que se muestra en la pantalla (ya filtrada)
  evaluacionesFiltradas: Evaluacion[] = [];

  // Propiedades enlazadas a los inputs del HTML
  terminoBusqueda: string = '';
  filtroEstado: string = 'todos';

  // Propiedades para controlar el modal de eliminación
  modalVisible: boolean = false;
  evaluacionAEliminar: Evaluacion | null = null;

  // 4. Inyectamos el Router en el constructor para poder navegar
  constructor(private router: Router) {}

  // --- CICLO DE VIDA ---

  // ngOnInit se ejecuta una vez que el componente está listo
  ngOnInit(): void {
    this.cargarEvaluaciones();
    this.render(); // Renderizamos la lista inicial
  }

  // --- MÉTODOS ---

  cargarEvaluaciones(): void {
    // Obtenemos los datos de localStorage (o de un servicio en un futuro)
    const datosGuardados = localStorage.getItem('evaluaciones');
    this.listaCompleta = datosGuardados ? JSON.parse(datosGuardados) : [];
  }

  render(): void {
    // Esta función ahora filtra la lista en lugar de generar HTML
    let items = this.listaCompleta;

    // 1. Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      items = items.filter(e => e.estado === this.filtroEstado);
    }

    // 2. Filtrar por término de búsqueda
    if (this.terminoBusqueda) {
      const busquedaLower = this.terminoBusqueda.toLowerCase();
      items = items.filter(e => e.titulo.toLowerCase().includes(busquedaLower));
    }

    this.evaluacionesFiltradas = items;
  }
  
  // --- MÉTODOS PARA ACCIONES (llamados desde el HTML) ---

  editarEvaluacion(evaluacion: Evaluacion): void {
    // Guardamos la evaluación a editar y navegamos
    localStorage.setItem('evaEdit', JSON.stringify(evaluacion));
    this.router.navigate(['/docente/crear-evaluacion']); // Asume que esta es la ruta
  }

  verEvaluacion(evaluacion: Evaluacion): void {
    // Similar a editar, pero podrías pasar un parámetro para modo "solo lectura"
    localStorage.setItem('evaEdit', JSON.stringify(evaluacion));
    this.router.navigate(['/docente/crear-evaluacion']); // Reutilizamos la misma ruta
  }

  // --- MÉTODOS PARA EL MODAL ---
  
  abrirModal(evaluacion: Evaluacion): void {
    this.evaluacionAEliminar = evaluacion;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.evaluacionAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.evaluacionAEliminar) return;

    // Filtramos la lista para quitar el elemento
    this.listaCompleta = this.listaCompleta.filter(e => e.id !== this.evaluacionAEliminar!.id);
    
    // Guardamos la nueva lista en localStorage
    localStorage.setItem('evaluaciones', JSON.stringify(this.listaCompleta));

    this.render(); // Actualizamos la vista
    this.cerrarModal(); // Cerramos el modal
  }
}