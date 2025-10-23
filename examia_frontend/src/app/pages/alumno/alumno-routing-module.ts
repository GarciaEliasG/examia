import { Routes } from '@angular/router';

// Importar componentes standalone
import { LoginAlumno } from './components/login-alumno/login-alumno.component';
import { PanelAlumno } from './components/panel-alumno/panel-alumno.component';
import { Materias } from './components/materias/materias.component';
import { ExamenesAlumno } from './components/evaluaciones/evaluaciones.component';
import { Instrucciones } from './components/instrucciones/instrucciones.component';
import { RealizarEvaluacion } from './components/realizar-evaluacion/realizar-evaluacion.component';
import { Envio } from './components/envio/envio.component';
import { Resultado } from './components/resultado/resultado.component';
import { Retroalimentacion } from './components/retroalimentacion/retroalimentacion.component';

export const alumnoRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginAlumno },
  { path: 'panel', component: PanelAlumno },
  { path: 'materias', component: Materias },
  { path: 'evaluaciones', component: ExamenesAlumno },
  { path: 'instrucciones/:id', component: Instrucciones },
  { path: 'realizar-evaluacion/:id', component: RealizarEvaluacion },
  { path: 'envio/:id', component: Envio },
  { path: 'resultado/:id', component: Resultado },
  { path: 'retroalimentacion/:id', component: Retroalimentacion },

];