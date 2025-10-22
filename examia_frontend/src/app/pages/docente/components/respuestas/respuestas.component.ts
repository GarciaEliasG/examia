import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importamos FormsModule para [(ngModel)]
import { Router } from '@angular/router'; // Importamos Router para la navegación

// Interfaz para definir la estructura de una evaluación
interface EvaluacionRespuesta {
  id: string;
  titulo: string;
  curso: string;
  respuestas: number;
}

@Component({
  selector: 'app-respuestas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule // Lo añadimos a los imports
  ],
  templateUrl: './respuestas.component.html',
  styleUrls: ['./respuestas.component.css'] // Asumo que tienes un CSS con este nombre
})
export class Respuestas implements OnInit {

  // --- PROPIEDADES DEL COMPONENTE ---

  listaCompleta: EvaluacionRespuesta[] = [];
  evaluacionesFiltradas: EvaluacionRespuesta[] = [];
  terminoBusqueda: string = '';

  // Inyectamos el Router para poder navegar a otras páginas
  constructor(private router: Router) { }

  ngOnInit(): void {
    // Cuando el componente se inicia, cargamos los datos y los mostramos
    this.cargarDatosDeEjemplo();
    this.render();
  }

  // --- MÉTODOS ---

  cargarDatosDeEjemplo(): void {
    // En una aplicación real, estos datos vendrían de un servicio que se comunica con tu backend.
    const mockEvaluaciones: EvaluacionRespuesta[] = [
      { id:'eva01', titulo:'Evaluación Unidad 1', curso:'1° Año', respuestas:4 },
      { id:'eva02', titulo:'Evaluación Unidad 2', curso:'2° Año', respuestas:2 },
      { id:'eva03', titulo:'Prueba de repaso', curso:'1° Año', respuestas:0 },
    ];
    this.listaCompleta = mockEvaluaciones;
  }

  render(): void {
    // La función de renderizado ahora solo se encarga de filtrar
    const busquedaLower = this.terminoBusqueda.toLowerCase();
    
    if (!busquedaLower) {
      this.evaluacionesFiltradas = this.listaCompleta;
    } else {
      this.evaluacionesFiltradas = this.listaCompleta.filter(e => 
        e.titulo.toLowerCase().includes(busquedaLower)
      );
    }
  }

  verCorregir(evaluacionId: string): void {
    console.log(`Navegando para corregir la evaluación con ID: ${evaluacionId}`);
    // Aquí iría la lógica para navegar a la página de corrección, por ejemplo:
    // this.router.navigate(['/docente/corregir', evaluacionId]);
  }
}