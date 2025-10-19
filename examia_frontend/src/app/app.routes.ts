import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/home/register.component';
import { PanelDocente } from './pages/docente/panel-docente/panel-docente';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'docente', component: PanelDocente },
  { 
    path: 'alumno', 
    loadChildren: () => import('./pages/alumno/alumno-routing-module').then(m => m.alumnoRoutes)
  },
  { path: '**', redirectTo: '' }
];