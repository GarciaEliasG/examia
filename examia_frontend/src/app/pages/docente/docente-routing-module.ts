// docente-routing-module.ts

import { PanelDocente } from './components/panel-docente/panel-docente';
import { Materias } from './components/materias/materias';
import { CargarPreguntas } from './components/cargar-preguntas/cargar-preguntas';
// Asumo que tienes un componente de login para docentes, si no, créalo.
// import { LoginDocente } from './components/login-docente/login-docente';
import { Routes } from '@angular/router';
import { CorregirEvaluaciones } from './components/corregir-evaluaciones/corregir-evaluaciones';
import { CrearEvaluacion } from './components/crear-evaluacion/crear-evaluacion';
import { GestionAlumnos } from './components/gestion-alumnos/gestion-alumnos';
import { Respuestas } from './components/respuestas/respuestas';


export const docenteRoutes: Routes = [
  // 1. La ruta vacía ahora carga el PanelDocente
  { path: '', component: Materias },
  { path: 'panel-docente', component: PanelDocente},
  { path: 'materias', component: Materias },
  { path: 'cargar-preguntas', component: CargarPreguntas },
  { path: 'corregir-evaluacion', component: CorregirEvaluaciones},
  { path: 'crear-evaluacion', component: CrearEvaluacion},
  { path: 'evaluaciones', component: CrearEvaluacion },
  { path: 'gestion-alumnos', component: GestionAlumnos},
  { path: 'respuestas', component: Respuestas},

];