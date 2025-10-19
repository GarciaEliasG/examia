// alumno.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {alumnoRoutes } from './alumno-routing-module';

// Importar todos los componentes
import { LoginAlumno } from './components/login-alumno/login-alumno.component';
import { PanelAlumno } from './components/panel-alumno/panel-alumno.component';
import { Materias } from './components/materias/materias.component';
import { Evaluaciones } from './components/evaluaciones/evaluaciones.component';
import { Instrucciones } from './components/instrucciones/instrucciones.component';
import { RealizarEvaluacion } from './components/realizar-evaluacion/realizar-evaluacion.component';
import { Envio } from './components/envio/envio.component';
import { Resultado } from './components/resultado/resultado.component';
import { Retroalimentacion } from './components/retroalimentacion/retroalimentacion.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(alumnoRoutes)
  ]
})
export class AlumnoModule { }