// pages/docente/components/crear-evaluacion/crear-evaluacion.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../../services/docente';
import { CrearPreguntaComponent } from '../crear-preguntas/crear-pregunta.component';

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CrearPreguntaComponent,NgIf,NgFor],
  templateUrl: './crear-evaluacion.component.html',
  styleUrls: ['./crear-evaluacion.component.css']
})
export class CrearEvaluacion implements OnInit {
  cursos: any[] = [];
  evaluacion = {
    titulo: '',
    descripcion: '',
    curso_id: null as number | null,
    fecha_limite: '',
    duracion_minutos: 60,
    intentos_permitidos: 1,
    preguntas: [] as any[]
  };
  
  preguntasDisponibles: any[] = [];
  showPreguntasModal: boolean = false;
  showCrearPreguntaModal: boolean = false;
  showSuccessModal: boolean = false; // NUEVO: Modal de éxito
  isLoading: boolean = false;
  isCargandoCursos: boolean = true;
  error: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private docenteService: DocenteService
  ) {}

  ngOnInit() {
    this.cargarCursos();
    
    // Si viene con curso pre-seleccionado
    this.route.queryParams.subscribe(params => {
      if (params['curso_id']) {
        this.evaluacion.curso_id = parseInt(params['curso_id']);
      }
    });
  }

  cargarCursos() {
    this.isCargandoCursos = true;
    
    this.docenteService.getCursos().subscribe({
      next: (data: any) => {
        console.log('✅ Cursos cargados:', data);
        this.cursos = Array.isArray(data) ? data : [];
        this.isCargandoCursos = false;
        
        // Cargar preguntas disponibles después de cargar cursos
        this.cargarPreguntasDisponibles();
      },
      error: (error) => {
        console.error('❌ Error cargando cursos:', error);
        this.error = 'Error al cargar los cursos';
        this.isCargandoCursos = false;
        
        // Datos de ejemplo como fallback
        this.cargarCursosEjemplo();
      }
    });
  }

  private cargarCursosEjemplo() {
    this.cursos = [
      {
        id: 1,
        nombre: 'Matemáticas Avanzadas',
        codigo: 'MAT101'
      },
      {
        id: 2,
        nombre: 'Programación I',
        codigo: 'PROG101'
      },
      {
        id: 3,
        nombre: 'Base de Datos',
        codigo: 'BD101'
      }
    ];
  }

  cargarPreguntasDisponibles() {
    // En una implementación real, esto vendría de un servicio
    // Por ahora usamos preguntas de ejemplo
    this.preguntasDisponibles = [
      {
        id: 1,
        enunciado: '¿Qué es el modelo OSI y cuáles son sus capas?',
        tipo: 'desarrollo',
        puntaje: 5,
        opciones: []
      },
      {
        id: 2,
        enunciado: 'Selecciona los protocolos de la capa de transporte:',
        tipo: 'multiple_choice',
        puntaje: 3,
        opciones: ['TCP', 'UDP', 'HTTP', 'FTP', 'IP']
      },
      {
        id: 3,
        enunciado: '¿Qué puerto utiliza el protocolo HTTP por defecto?',
        tipo: 'texto',
        puntaje: 2,
        opciones: []
      },
      {
        id: 4,
        enunciado: 'Explica la diferencia entre HTTP y HTTPS',
        tipo: 'desarrollo',
        puntaje: 4,
        opciones: []
      },
      {
        id: 5,
        enunciado: '¿Cuál de estas NO es una base de datos NoSQL?',
        tipo: 'multiple_choice',
        puntaje: 3,
        opciones: ['MongoDB', 'Redis', 'MySQL', 'Cassandra', 'DynamoDB']
      }
    ];
  }

  // ===== MÉTODOS PARA EL MODAL DE PREGUNTAS EXISTENTES =====
  
  abrirPreguntasModal() {
    this.showPreguntasModal = true;
  }

  cerrarPreguntasModal() {
    this.showPreguntasModal = false;
  }

  agregarPregunta(pregunta: any) {
    // Verificar si la pregunta ya está agregada
    const yaExiste = this.evaluacion.preguntas.some(p => p.id === pregunta.id);
    if (yaExiste) {
      alert('Esta pregunta ya fue agregada a la evaluación');
      return;
    }

    const nuevaPregunta = {
      ...pregunta,
      orden: this.evaluacion.preguntas.length + 1,
      // Para preguntas de opción múltiple, agregar campo para respuesta correcta
      es_correcta: pregunta.tipo === 'multiple_choice' ? 0 : null
    };

    this.evaluacion.preguntas.push(nuevaPregunta);
    console.log('✅ Pregunta agregada:', nuevaPregunta);
  }

  // ===== MÉTODOS PARA EL NUEVO MODAL DE CREAR PREGUNTA =====

  abrirCrearPreguntaModal() {
    this.showCrearPreguntaModal = true;
  }

  cerrarCrearPreguntaModal() {
    this.showCrearPreguntaModal = false;
  }

  // Método que se ejecuta cuando se crea una nueva pregunta
  onPreguntaCreada(nuevaPregunta: any) {
    // Asignar un ID temporal único
    nuevaPregunta.id = Date.now() + Math.random();
    nuevaPregunta.orden = this.evaluacion.preguntas.length + 1;
    
    this.evaluacion.preguntas.push(nuevaPregunta);
    this.cerrarCrearPreguntaModal();
    
    console.log('✅ Nueva pregunta creada y agregada:', nuevaPregunta);
    
    // Opcional: Mostrar mensaje de éxito
    this.mostrarMensajeExito('Pregunta creada y agregada a la evaluación');
  }

  // Método auxiliar para mostrar mensajes
  private mostrarMensajeExito(mensaje: string) {
    // Podrías implementar un sistema de notificaciones aquí
    console.log('🎉 ' + mensaje);
  }

  // ===== MÉTODOS EXISTENTES (SIN CAMBIOS) =====

  removerPregunta(index: number) {
    this.evaluacion.preguntas.splice(index, 1);
    // Actualizar órdenes
    this.evaluacion.preguntas.forEach((pregunta, i) => {
      pregunta.orden = i + 1;
    });
  }

  moverPreguntaArriba(index: number) {
    if (index > 0) {
      const temp = this.evaluacion.preguntas[index];
      this.evaluacion.preguntas[index] = this.evaluacion.preguntas[index - 1];
      this.evaluacion.preguntas[index - 1] = temp;
      
      // Actualizar órdenes
      this.actualizarOrdenPreguntas();
    }
  }

  moverPreguntaAbajo(index: number) {
    if (index < this.evaluacion.preguntas.length - 1) {
      const temp = this.evaluacion.preguntas[index];
      this.evaluacion.preguntas[index] = this.evaluacion.preguntas[index + 1];
      this.evaluacion.preguntas[index + 1] = temp;
      
      // Actualizar órdenes
      this.actualizarOrdenPreguntas();
    }
  }

  private actualizarOrdenPreguntas() {
    this.evaluacion.preguntas.forEach((pregunta, i) => {
      pregunta.orden = i + 1;
    });
  }

  // ===== MÉTODO ACTUALIZADO: GUARDAR EVALUACIÓN =====

  guardarEvaluacion() {
    if (!this.validarEvaluacion()) return;

    this.isLoading = true;

    // PROCESAR FECHA - solo la parte de la fecha
    let fechaLimiteProcesada = null;
    if (this.evaluacion.fecha_limite) {
      fechaLimiteProcesada = this.evaluacion.fecha_limite.split('T')[0];
    }

    const examenData = {
      titulo: this.evaluacion.titulo,
      descripcion: this.evaluacion.descripcion,
      curso_id: this.evaluacion.curso_id,
      fecha_limite: fechaLimiteProcesada,
      preguntas: this.evaluacion.preguntas.map(p => ({
        enunciado: p.enunciado,
        tipo: p.tipo,
        puntaje: p.puntaje,
        opciones: p.opciones || [],
        orden: p.orden
      }))
    };

    console.log('📤 Enviando evaluación:', examenData);

    this.docenteService.crearExamen(examenData).subscribe({
      next: (response) => {
        console.log('✅ Evaluación creada:', response);
        this.isLoading = false;
        
        // MOSTRAR MODAL DE ÉXITO EN LUGAR DE REDIRIGIR INMEDIATAMENTE
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('❌ Error creando evaluación:', error);
        this.isLoading = false;
        alert('Error al crear la evaluación: ' + (error.error?.error || error.message));
      }
    });
  }

  // ===== NUEVOS MÉTODOS PARA EL MODAL DE ÉXITO =====

  obtenerNombreCurso(): string {
    if (!this.evaluacion.curso_id) return 'No especificado';
    const curso = this.cursos.find(c => c.id === this.evaluacion.curso_id);
    return curso ? curso.nombre : 'Curso no encontrado';
  }

  cerrarModalExito() {
    this.showSuccessModal = false;
  }

  irAlMenuPrincipal() {
    this.showSuccessModal = false;
    this.router.navigate(['/docente/panel']);
  }

  crearOtraEvaluacion() {
    this.showSuccessModal = false;
    // Resetear el formulario para crear otra evaluación
    this.evaluacion = {
      titulo: '',
      descripcion: '',
      curso_id: null,
      fecha_limite: '',
      duracion_minutos: 60,
      intentos_permitidos: 1,
      preguntas: []
    };
    
    // Opcional: mantener el curso seleccionado si había uno
    if (this.route.snapshot.queryParams['curso_id']) {
      this.evaluacion.curso_id = parseInt(this.route.snapshot.queryParams['curso_id']);
    }
  }

  // ===== MÉTODOS EXISTENTES (SIN CAMBIOS) =====

  validarEvaluacion(): boolean {
    if (!this.evaluacion.titulo.trim()) {
      alert('El título de la evaluación es requerido');
      return false;
    }

    if (!this.evaluacion.curso_id) {
      alert('Debes seleccionar un curso para la evaluación');
      return false;
    }

    if (this.evaluacion.preguntas.length === 0) {
      alert('Debes agregar al menos una pregunta a la evaluación');
      return false;
    }

    // Validar que todas las preguntas tengan enunciado
    for (let i = 0; i < this.evaluacion.preguntas.length; i++) {
      const pregunta = this.evaluacion.preguntas[i];
      if (!pregunta.enunciado.trim()) {
        alert(`La pregunta ${i + 1} no tiene enunciado`);
        return false;
      }
    }

    return true;
  }

  calcularPuntajeTotal(): number {
    return this.evaluacion.preguntas.reduce((total, pregunta) => {
      return total + (parseFloat(pregunta.puntaje) || 0);
    }, 0);
  }

  cancelar() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
      this.router.navigate(['/docente/evaluaciones']);
    }
  }

  getTipoPreguntaTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'multiple_choice': 'Opción Múltiple',
      'desarrollo': 'Desarrollo',
      'texto': 'Texto Corto'
    };
    return tipos[tipo] || tipo;
  }

  // ===== MÉTODOS PARA LAS EXPRESIONES EN EL TEMPLATE =====

  estaPreguntaAgregada(preguntaId: number): boolean {
    return this.evaluacion.preguntas.some(p => p.id === preguntaId);
  }

  getTextoBotonPregunta(preguntaId: number): string {
    return this.estaPreguntaAgregada(preguntaId) ? 'Agregada' : 'Agregar';
  }

  puedeMoverArriba(index: number): boolean {
    return index > 0;
  }

  puedeMoverAbajo(index: number): boolean {
    return index < this.evaluacion.preguntas.length - 1;
  }

  esPreguntaAgregada(preguntaId: number): boolean {
    return this.estaPreguntaAgregada(preguntaId);
  }
}