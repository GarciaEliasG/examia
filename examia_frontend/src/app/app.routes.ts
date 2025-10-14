import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/home/register.component';
import { PanelDocente } from './pages/docente/panel-docente/panel-docente';
import { PanelAlumno } from './pages/alumno/panel-alumno/panel-alumno';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'docente', component: PanelDocente },
  { path: 'alumno', component: PanelAlumno },
  { path: '**', redirectTo: '' }
];




