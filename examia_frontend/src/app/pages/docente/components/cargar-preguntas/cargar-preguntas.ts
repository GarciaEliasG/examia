import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngFor, *ngIf, [ngSwitch]
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { Router, RouterModule } from '@angular/router'; // Para routerLink y navegar
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Para previsualizar archivos

// --- Interfaces para definir nuestros datos ---

interface Alerta {
  id: number;
  type: 'success' | 'warn' | 'error' | 'info';
  title: string;
  desc: string;
}

interface Opcion {
  id: string;
  texto: string;
}

interface Adjunto {
  id: string;
  nombre: string;
  tipo: 'img' | 'file' | 'video';
  url: SafeUrl; // URL segura para previsualización
  file: File; // El archivo original
}

interface Pregunta {
  id: string; // ID único para la pregunta
  titulo: string;
  tipo: 'choice' | 'short' | 'para';
  opciones: Opcion[];
  adjuntos: Adjunto[];
}

@Component({
  selector: 'app-cargar-preguntas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './cargar-preguntas.html',
  styleUrl: './cargar-preguntas.css' // Asumo que tienes un CSS
})
export class CargarPreguntas implements OnInit {

  public tituloBanco: string = '';
  public preguntas: Pregunta[] = [];
  public alertas: Alerta[] = [];
  
  // Opciones para el <select> de tipo de pregunta
  public tiposPregunta = [
    { value: 'choice', label: 'Multiple choice' },
    { value: 'short',  label: 'Respuesta corta' },
    { value: 'para',   label: 'Párrafo' }
  ];

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer // Necesario para crear URLs seguras
  ) { }

  ngOnInit(): void {
    // Carga los datos guardados si existen
    const bancoGuardado = localStorage.getItem('preguntasBanco');
    if (bancoGuardado) {
      this.preguntas = JSON.parse(bancoGuardado);
      // Nota: Faltaría cargar el título del banco si también se guarda
    } else {
      // Inicia con una pregunta si no hay nada guardado
      this.agregarPregunta();
    }
  }

  // --- Lógica de Preguntas ---

  agregarPregunta(): void {
    const nuevaPregunta: Pregunta = {
      id: crypto.randomUUID(),
      titulo: '',
      tipo: 'choice',
      opciones: [
        { id: crypto.randomUUID(), texto: '' },
        { id: crypto.randomUUID(), texto: '' }
      ],
      adjuntos: []
    };
    this.preguntas.push(nuevaPregunta);
    // Desplazarse al final (opcional, pero buena UX)
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  }

  eliminarPregunta(preguntaAEliminar: Pregunta): void {
    // Limpia las URLs de los adjuntos para liberar memoria
    preguntaAEliminar.adjuntos.forEach(adj => URL.revokeObjectURL(adj.file.name)); // Asumiendo que guardaste la URL original
    this.preguntas = this.preguntas.filter(p => p.id !== preguntaAEliminar.id);
  }

  duplicarPregunta(preguntaADuplicar: Pregunta, index: number): void {
    // structuredClone es la forma moderna y segura de duplicar objetos complejos
    const clon: Pregunta = structuredClone(preguntaADuplicar);
    
    // Asigna nuevos IDs a todo lo clonado
    clon.id = crypto.randomUUID();
    clon.opciones.forEach(opt => opt.id = crypto.randomUUID());
    // Nota: La lógica de adjuntos se complica, por ahora los eliminamos del clon
    clon.adjuntos = []; 

    // Inserta el clon justo después del original
    this.preguntas.splice(index + 1, 0, clon);
  }

  // --- Lógica de Opciones (para Multiple Choice) ---

  agregarOpcion(pregunta: Pregunta): void {
    pregunta.opciones.push({
      id: crypto.randomUUID(),
      texto: ''
    });
  }

  eliminarOpcion(pregunta: Pregunta, opcionAEliminar: Opcion): void {
    pregunta.opciones = pregunta.opciones.filter(o => o.id !== opcionAEliminar.id);
  }

  // --- Lógica de Adjuntos ---

  onFileSelected(event: Event, pregunta: Pregunta, tipo: Adjunto['tipo']): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    
    // Crea una URL segura para la previsualización
    const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));

    pregunta.adjuntos.push({
      id: crypto.randomUUID(),
      nombre: file.name,
      tipo: tipo,
      url: url,
      file: file // Guardamos el archivo para un futuro (subir a un servidor)
    });

    // Limpia el input para permitir seleccionar el mismo archivo de nuevo
    input.value = '';
  }

  eliminarAdjunto(pregunta: Pregunta, adjuntoAEliminar: Adjunto): void {
    // Revoca la URL para liberar memoria
    URL.revokeObjectURL(adjuntoAEliminar.file.name); // Asumiendo que guardaste la URL original
    pregunta.adjuntos = pregunta.adjuntos.filter(adj => adj.id !== adjuntoAEliminar.id);
  }

  // --- Guardado y Navegación ---

  guardarYVolver(): void {
    // 1. Validaciones
    if (!this.tituloBanco.trim()) {
      this.showAlert('warn', 'Falta título', 'Ingresá un título para este banco de preguntas.');
      return;
    }
    if (this.preguntas.length === 0) {
      this.showAlert('warn', 'Sin preguntas', 'Agregá al menos una pregunta antes de guardar.');
      return;
    }
    for (const [index, p] of this.preguntas.entries()) {
      if (p.tipo === 'choice' && p.opciones.length < 2) {
        this.showAlert('error', `Pregunta ${index + 1}`, 'En “Multiple choice” necesitás al menos 2 opciones.');
        return;
      }
    }

    // 2. Serializar y guardar
    // Nota: El array `this.preguntas` ya es el "banco". 
    // Quitamos `file` y `url` si solo guardamos en localStorage
    const bancoParaGuardar = this.preguntas.map(p => ({
      id: p.id,
      titulo: p.titulo,
      tipo: p.tipo,
      opciones: p.opciones,
      // Solo guardamos nombres de adjuntos en localStorage
      attachments: p.adjuntos.map(adj => adj.nombre) 
    }));

    localStorage.setItem('preguntasBanco', JSON.stringify(bancoParaGuardar));
    
    // 3. Redirigir
    this.showAlert('success', 'Guardado', 'Tus preguntas se guardaron correctamente. Redirigiendo...', 1200);
    setTimeout(() => {
      // Usamos el Router de Angular
      this.router.navigate(['/docente/crear-evaluacion']); 
    }, 1200);
  }

  // --- Lógica de Alertas ---

  showAlert(type: Alerta['type'], title: string, desc: string, timeout: number = 4000): void {
    const id = Date.now();
    this.alertas.push({ id, type, title, desc });
    if (timeout) {
      setTimeout(() => this.closeAlert(id), timeout);
    }
  }

  closeAlert(id: number): void {
    this.alertas = this.alertas.filter(a => a.id !== id);
  }
}
