import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/home/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'alumno', 
    loadChildren: () => import('./pages/alumno/alumno-routing-module').then(m => m.alumnoRoutes)
  },
  { 
    path: 'docente', 
    loadChildren: () => import('./pages/docente/docente-routing-module').then(m => m.docenteRoutes)
  },
  { path: '**', redirectTo: '' }
];