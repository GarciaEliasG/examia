// alumno.module.ts - ELIMINAR o SIMPLIFICAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { alumnoRoutes } from './alumno-routing-module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(alumnoRoutes)
  ]
})
export class AlumnoModule { }