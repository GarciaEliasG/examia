// docente-routing-module.ts (ACTUALIZADO)
import { PanelDocente } from './components/panel-docente/panel-docente.component';
import { CursosDocente } from './components/cursos/cursos.component';
import { CrearEvaluacion } from './components/crear-evaluacion/crear-evaluacion.component';
import { GestionAlumnos } from './components/gestion-alumnos/gestion-alumnos.component';
import { CorregirEvaluaciones } from './components/corregir-evaluaciones/corregir-evaluaciones.component';
import { EditarCorreccionComponent } from './components/editar-correcciones/editar-correcciones.component'; // ✅ NUEVO
import { Routes } from '@angular/router';

export const docenteRoutes: Routes = [
  { path: '', component: PanelDocente },
  { path: 'panel', component: PanelDocente },
  { path: 'cursos', component: CursosDocente },
  { path: 'crear-evaluacion', component: CrearEvaluacion },
  { path: 'evaluaciones', component: CrearEvaluacion }, // Temporal
  { path: 'gestion-alumnos', component: GestionAlumnos },
  { path: 'corregir', component: CorregirEvaluaciones },
  { path: 'editar-correccion/:id', component: EditarCorreccionComponent }, // ✅ NUEVA RUTA
];