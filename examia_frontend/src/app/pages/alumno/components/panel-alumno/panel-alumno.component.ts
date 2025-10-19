import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importar RouterModule

@Component({
  selector: 'app-panel-alumno',
  standalone: true,
  imports: [CommonModule, RouterModule], // Agregar RouterModule aquí
  templateUrl: './panel-alumno.component.html',
  styleUrls: ['./panel-alumno.component.css']
})
export class PanelAlumno {
  constructor(private router: Router) {}

  volver() {
    this.router.navigate(['/alumno/login']);
  }
}