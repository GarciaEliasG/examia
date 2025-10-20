import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { docenteRoutes } from './docente-routing-module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(docenteRoutes)
  ]
})
export class DocenteModule { }