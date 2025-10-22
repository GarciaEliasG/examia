// pages/docente/components/crear-pregunta/crear-pregunta.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Pregunta {
  id?: number;
  enunciado: string;
  tipo: 'multiple_choice' | 'texto' | 'desarrollo';
  puntaje: number;
  opciones: string[];
  respuesta_correcta?: number;
  max_palabras?: number;
}

@Component({
  selector: 'app-crear-pregunta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,NgFor,NgIf],
  templateUrl: './crear-pregunta.component.html',
  styleUrls: ['./crear-pregunta.component.css']
})
export class CrearPreguntaComponent {
  @Output() preguntaCreada = new EventEmitter<Pregunta>();
  @Output() cancelar = new EventEmitter<void>();

  pregunta: Pregunta = {
    enunciado: '',
    tipo: 'multiple_choice',
    puntaje: 1,
    opciones: ['', '', '', ''],
    respuesta_correcta: 0,
    max_palabras: 100
  };

  // Opciones para el select de tipo de pregunta
  tiposPregunta = [
    { value: 'multiple_choice', label: 'Opción Múltiple' },
    { value: 'texto', label: 'Texto Corto' },
    { value: 'desarrollo', label: 'Desarrollo' }
  ];

  // Mensajes informativos por tipo de pregunta
  mensajesTipo: { [key: string]: { icon: string, titulo: string, descripcion: string } } = {
    multiple_choice: {
      icon: '🔘',
      titulo: 'Opción Múltiple',
      descripcion: 'El alumno seleccionará una opción entre varias. Define la respuesta correcta.'
    },
    texto: {
      icon: '📝',
      titulo: 'Texto Corto', 
      descripcion: 'El alumno escribirá una respuesta breve. Máximo 100 palabras.'
    },
    desarrollo: {
      icon: '📄',
      titulo: 'Desarrollo',
      descripcion: 'El alumno desarrollará el tema extensamente. Sin límite de palabras.'
    }
  };

  constructor() {}

  // TrackBy function para mejorar el rendimiento y evitar re-renderizados
  trackByFn(index: number, item: any): number {
    return index;
  }

  // Método para obtener mensaje actual
  getMensajeActual() {
    return this.mensajesTipo[this.pregunta.tipo];
  }

  // Método para agregar una nueva opción en múltiple choice
  agregarOpcion() {
    if (this.pregunta.opciones.length < 6) {
      this.pregunta.opciones.push('');
    }
  }

  // Método para eliminar una opción
  eliminarOpcion(index: number) {
    if (this.pregunta.opciones.length > 2) {
      this.pregunta.opciones.splice(index, 1);
      
      if (this.pregunta.respuesta_correcta !== undefined) {
        if (this.pregunta.respuesta_correcta === index) {
          this.pregunta.respuesta_correcta = 0;
        } else if (this.pregunta.respuesta_correcta > index) {
          this.pregunta.respuesta_correcta--;
        }
      }
    }
  }

  // Método para cambiar el tipo de pregunta
  cambiarTipoPregunta(tipo: string) {
    this.pregunta.tipo = tipo as any;
    
    if (tipo !== 'multiple_choice') {
      this.pregunta.opciones = [];
      this.pregunta.respuesta_correcta = undefined;
    } else {
      if (this.pregunta.opciones.length === 0) {
        this.pregunta.opciones = ['', '', '', ''];
        this.pregunta.respuesta_correcta = 0;
      }
    }
  }

  // Método para actualizar una opción específica SIN crear nuevo array
  actualizarOpcion(index: number, valor: string) {
    this.pregunta.opciones[index] = valor;
    // NO creamos un nuevo array para evitar re-renderizados
  }

  // Método para verificar si una opción es correcta
  esOpcionCorrecta(index: number): boolean {
    return this.pregunta.respuesta_correcta !== undefined && 
           this.pregunta.respuesta_correcta === index;
  }

  // Validar la pregunta antes de guardar
  validarPregunta(): boolean {
    if (!this.pregunta.enunciado.trim()) {
      alert('El enunciado de la pregunta es requerido');
      return false;
    }

    if (this.pregunta.puntaje <= 0) {
      alert('El puntaje debe ser mayor a 0');
      return false;
    }

    if (this.pregunta.tipo === 'multiple_choice') {
      const opcionesValidas = this.pregunta.opciones.filter(opcion => opcion.trim().length > 0);
      if (opcionesValidas.length < 2) {
        alert('Debe haber al menos 2 opciones válidas para pregunta múltiple choice');
        return false;
      }

      if (this.pregunta.respuesta_correcta === undefined) {
        alert('Debe seleccionar una respuesta correcta');
        return false;
      }

      if (this.pregunta.respuesta_correcta < 0 || 
          this.pregunta.respuesta_correcta >= this.pregunta.opciones.length) {
        alert('La respuesta correcta seleccionada no es válida');
        return false;
      }
    }

    return true;
  }

  // Verificar si el formulario es válido para habilitar el botón
  esFormularioValido(): boolean {
    if (!this.pregunta.enunciado.trim()) {
      return false;
    }

    if (this.pregunta.puntaje <= 0) {
      return false;
    }

    if (this.pregunta.tipo === 'multiple_choice') {
      const opcionesValidas = this.pregunta.opciones.filter(opcion => opcion.trim().length > 0);
      if (opcionesValidas.length < 2) {
        return false;
      }

      if (this.pregunta.respuesta_correcta === undefined) {
        return false;
      }

      if (this.pregunta.respuesta_correcta < 0 || 
          this.pregunta.respuesta_correcta >= this.pregunta.opciones.length) {
        return false;
      }
    }

    return true;
  }

  // Guardar la pregunta
  guardarPregunta() {
    if (!this.validarPregunta()) return;

    if (this.pregunta.tipo === 'multiple_choice') {
      this.pregunta.opciones = this.pregunta.opciones.filter(opcion => opcion.trim().length > 0);
      
      if (this.pregunta.respuesta_correcta !== undefined) {
        if (this.pregunta.respuesta_correcta >= this.pregunta.opciones.length) {
          this.pregunta.respuesta_correcta = 0;
        }
      }
    }

    this.preguntaCreada.emit({ ...this.pregunta });
  }

  // Cancelar la creación
  onCancelar() {
    this.cancelar.emit();
  }

  // Método para verificar si se puede eliminar una opción
  puedeEliminarOpcion(): boolean {
    return this.pregunta.opciones.length > 2;
  }

  // Método para verificar si se puede agregar una opción
  puedeAgregarOpcion(): boolean {
    return this.pregunta.opciones.length < 6;
  }
}