import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { Router, RouterModule } from '@angular/router'; // Para navegar

// --- Interfaces para nuestros datos ---
interface PreguntaSeleccionada {
  id: string;
  texto: string;
  // Agrega otros campos si los necesitas (ej. tipo, puntaje)
}

interface Evaluacion {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  desc: string;
  preguntas: PreguntaSeleccionada[];
  estado: 'borrador' | 'publicada';
}

interface Alert {
  type: 'success' | 'warn' | 'error' | 'info';
  message: string;
  id: number;
}

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true, // Asumimos que es standalone
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // Para routerLink
  ],
  templateUrl: './crear-evaluacion.html',
  styleUrl: './crear-evaluacion.css'
})
export class CrearEvaluacion implements OnInit {

  // --- Propiedades del formulario ---
  public evaluacion: Evaluacion = {
    id: '',
    titulo: '',
    fecha: '',
    hora: '',
    desc: '',
    preguntas: [],
    estado: 'borrador'
  };
  
  public isEditMode = false;
  public alerts: Alert[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.cargarDatosModoEdicion();
    this.cargarPreguntasSeleccionadas();
  }

  // --- Carga de Datos ---

  cargarDatosModoEdicion(): void {
    // Revisa si estamos en modo "Editar"
    const evaEditData = localStorage.getItem('evaEdit');
    if (evaEditData) {
      this.isEditMode = true;
      const eva = JSON.parse(evaEditData);
      
      // Poblamos el formulario con los datos de la evaluación
      this.evaluacion = {
        id: eva.id,
        titulo: eva.titulo,
        fecha: eva.fecha,
        hora: eva.hora,
        desc: eva.desc,
        preguntas: eva.preguntas || [], // Usamos las preguntas de la evaluación
        estado: eva.estado
      };
      
      // Si estamos editando, las preguntas seleccionadas son las de la propia evaluación
      localStorage.setItem('preguntasSeleccionadas', JSON.stringify(this.evaluacion.preguntas));
      
      // Limpiamos la bandera de edición
      localStorage.removeItem('evaEdit');
    }
  }
  
  cargarPreguntasSeleccionadas(): void {
    // Carga las preguntas que se hayan seleccionado en la pág. "Cargar Preguntas"
    const preguntasData = localStorage.getItem('preguntasSeleccionadas');
    this.evaluacion.preguntas = preguntasData ? JSON.parse(preguntasData) : [];
  }

  // --- Acciones de Preguntas ---

  removerPregunta(preguntaId: string): void {
    this.evaluacion.preguntas = this.evaluacion.preguntas.filter(p => p.id !== preguntaId);
    // Actualizamos el localStorage para que persista
    localStorage.setItem('preguntasSeleccionadas', JSON.stringify(this.evaluacion.preguntas));
  }

  irACargarPreguntas(): void {
    // Navega a la página de selección de preguntas
    this.router.navigate(['/docente/cargar-preguntas']);
  }

  // --- Guardado y Navegación ---

  guardarEvaluacion(): void {
    // 1. Validar datos
    if (!this.evaluacion.titulo || !this.evaluacion.fecha || !this.evaluacion.hora) {
      this.showAlert('warn', 'Faltan datos clave. Asegúrate de completar título, fecha y hora.');
      return;
    }
    
    // 2. Determinar estado
    this.evaluacion.estado = this.evaluacion.preguntas.length > 0 ? 'publicada' : 'borrador';

    // 3. Obtener la lista de evaluaciones de localStorage
    const evaluacionesGuardadas = JSON.parse(localStorage.getItem('evaluaciones') || '[]');
    
    if (this.isEditMode) {
      // Modo Edición: Reemplazar la existente
      const index = evaluacionesGuardadas.findIndex((e: Evaluacion) => e.id === this.evaluacion.id);
      if (index > -1) {
        evaluacionesGuardadas[index] = this.evaluacion; // Actualiza
      } else {
        evaluacionesGuardadas.push(this.evaluacion); // Si no la encuentra, la agrega (fallback)
      }
    } else {
      // Modo Creación: Agregar una nueva
      this.evaluacion.id = crypto.randomUUID(); // Asigna un nuevo ID
      evaluacionesGuardadas.push(this.evaluacion);
    }
    
    // 4. Guardar la lista actualizada
    localStorage.setItem('evaluaciones', JSON.stringify(evaluacionesGuardadas));

    // 5. Limpiar selecciones temporales
    localStorage.removeItem('preguntasSeleccionadas');
    
    // 6. Mostrar alerta y redirigir
    this.showAlert('success', '¡Evaluación guardada exitosamente!');
    setTimeout(() => {
      this.router.navigate(['/docente/evaluaciones']);
    }, 1200);
  }

  cancelar(): void {
    // Limpia los datos temporales y vuelve
    localStorage.removeItem('preguntasSeleccionadas');
    localStorage.removeItem('evaEdit');
    this.router.navigate(['/docente/evaluaciones']);
  }

  // --- Lógica de Alertas ---

  showAlert(type: Alert['type'], message: string, timeout: number = 3000): void {
    const id = Date.now();
    this.alerts.push({ type, message, id });
    if (timeout) {
      setTimeout(() => this.closeAlert(id), timeout);
    }
  }

  closeAlert(id: number): void {
    this.alerts = this.alerts.filter(a => a.id !== id);
  }
}
