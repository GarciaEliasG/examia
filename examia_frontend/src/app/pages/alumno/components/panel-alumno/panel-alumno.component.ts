import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel-alumno',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-alumno.component.html',
  styleUrls: ['./panel-alumno.component.css']
})
export class PanelAlumno {
  constructor(private router: Router) {}
}