import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngFor, *ngIf
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { Router } from '@angular/router'; // Para navegar

// --- Interfaces para definir nuestros datos ---
interface Materia {
  id: string;
  nombre: string;
}

interface Alert {
  type: 'success' | 'warn' | 'error' | 'info';
  title: string;
  desc: string;
  id: number;
}

interface ConfirmDialog {
  title: string;
  desc: string;
  onConfirm: () => void; // Función que se ejecuta si se presiona "Sí"
}

@Component({
  selector: 'app-materias',
  standalone: true, // Asegúrate de que tu componente sea standalone
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class Materias implements OnInit {

  private readonly STORAGE_KEY = 'materias';
  
  // --- Propiedades para el estado del componente ---
  public materias: Materia[] = [];
  public nuevaMateriaNombre: string = '';
  public materiaSeleccionadaId: string = ''; // Enlazado al <select>

  public alerts: Alert[] = [];
  public confirmDialog: ConfirmDialog | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // 1. Asegura que existan datos de ejemplo si es la primera vez
    this.ensureSeed();
    // 2. Carga las materias en la propiedad del componente
    this.cargarMaterias();
  }

  // --- Lógica de Acciones (CRUD) ---

  cargarMaterias(): void {
    this.materias = this.getMaterias();
  }

  crearMateria(): void {
    const nombre = this.nuevaMateriaNombre.trim();
    if (!nombre) {
      this.showAlert('warn', 'Falta nombre', 'Ingresá un nombre para crear la materia.');
      return;
    }

    const materias = this.getMaterias();
    if (materias.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) {
      this.showAlert('error', 'Nombre duplicado', 'Ya existe una materia con ese nombre.');
      return;
    }

    materias.push({ id: crypto.randomUUID(), nombre });
    this.setMaterias(materias);
    this.cargarMaterias(); // Actualiza el <select>
    this.nuevaMateriaNombre = ''; // Limpia el input
    this.showAlert('success', 'Materia creada', `La materia “${nombre}” se creó correctamente.`);
  }

  editarMateria(): void {
    const id = this.materiaSeleccionadaId;
    if (!id) {
      this.showAlert('warn', 'Seleccioná una materia', 'Elegí una materia para poder editarla.');
      return;
    }

    let materias = this.getMaterias();
    const materia = materias.find(m => m.id === id);
    if (!materia) return;

    const nuevoNombre = prompt('Editar nombre de la materia:', materia.nombre);
    
    if (nuevoNombre === null) return; // El usuario canceló
    
    const nombreTrim = nuevoNombre.trim();
    if (!nombreTrim) {
      this.showAlert('warn', 'Nombre vacío', 'El nombre no puede estar vacío.');
      return;
    }

    if (materias.some(m => m.id !== id && m.nombre.toLowerCase() === nombreTrim.toLowerCase())) {
      this.showAlert('error', 'Nombre duplicado', 'Ya existe otra materia con ese nombre.');
      return;
    }

    // Actualizamos el nombre en el array y guardamos
    materias = materias.map(m => m.id === id ? { ...m, nombre: nombreTrim } : m);
    this.setMaterias(materias);
    this.cargarMaterias(); // Recarga el <select>
    this.showAlert('success', 'Materia actualizada', `Renombraste a “${nombreTrim}”.`);
  }

  eliminarMateria(): void {
    const id = this.materiaSeleccionadaId;
    if (!id) {
      this.showAlert('warn', 'Seleccioná una materia', 'Elegí una materia para poder eliminarla.');
      return;
    }

    const materias = this.getMaterias();
    const materia = materias.find(m => m.id === id);
    if (!materia) return;

    // Usamos el modal de confirmación
    this.showConfirm(
      'Eliminar materia',
      `Vas a eliminar “${materia.nombre}”. Esta acción no se puede deshacer.`,
      () => {
        // Esta función se pasa como callback y se ejecuta al confirmar
        const nuevas = materias.filter(m => m.id !== id);
        this.setMaterias(nuevas);
        this.cargarMaterias();
        this.materiaSeleccionadaId = ''; // Resetea el select
        this.showAlert('success', 'Materia eliminada', `Se eliminó “${materia.nombre}”.`);
      }
    );
  }

  irAlPanel(): void {
    const id = this.materiaSeleccionadaId;
    if (!id) {
      this.showAlert('warn', 'Seleccioná una materia', 'Elegí una materia para ir a su panel.');
      return;
    }
    
    const materia = this.materias.find(m => m.id === id);
    if (materia) {
      // Guardamos la selección para que la use el panel
      localStorage.setItem('materiaSeleccionada', materia.nombre);
    }
    
    // Navegamos usando el Router de Angular
    this.router.navigate(['/docente/panel']); // Ajusta esta ruta si es necesario
  }

  // --- Lógica de Almacenamiento (localStorage) ---
  
  private getMaterias(): Materia[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private setMaterias(arr: Materia[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(arr));
  }

  private ensureSeed(): void {
    if (this.getMaterias().length > 0) return;
    this.setMaterias([
      { id: crypto.randomUUID(), nombre: 'Psicología Cognitiva' },
      { id: crypto.randomUUID(), nombre: 'Sistemas Operativos' },
      { id: crypto.randomUUID(), nombre: 'Bases de Datos' }
    ]);
  }

  // --- Lógica de Alertas y Modales ---

  showAlert(type: Alert['type'], title: string, desc: string, timeout: number = 4000): void {
    const id = Date.now();
    this.alerts.push({ type, title, desc, id });
    if (timeout) {
      setTimeout(() => this.closeAlert(id), timeout);
    }
  }

  closeAlert(id: number): void {
    this.alerts = this.alerts.filter(a => a.id !== id);
  }

  showConfirm(title: string, desc: string, onConfirm: () => void): void {
    this.confirmDialog = { title, desc, onConfirm };
  }

  closeConfirm(): void {
    this.confirmDialog = null;
  }

  executeConfirm(): void {
    this.confirmDialog?.onConfirm(); // Ejecuta la acción de borrado
    this.closeConfirm(); // Cierra el modal
  }
}