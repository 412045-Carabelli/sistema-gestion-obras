import { Routes } from '@angular/router';
import {ObrasComponent} from './features/pages/obras/obras.component';
import {ObrasDetailComponent} from './features/pages/obras-detail/obras-detail.component';
import {ObrasCreateComponent} from './features/pages/obras-create/obras-create.component';
import {ObrasEditComponent} from './features/pages/obras-edit/obras-edit.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'obras',
    pathMatch: 'full'
  },
  {
    path: 'obras',
    loadComponent: () =>
      import('./features/pages/obras/obras.component').then(m => m.ObrasComponent),
  },
  {
    path: 'obras/nueva',
    loadComponent: () =>
      import('./features/pages/obras-create/obras-create.component').then(m => m.ObrasCreateComponent),
  },
  {
    path: 'obras/editar/:id',
    loadComponent: () =>
      import('./features/pages/obras-edit/obras-edit.component').then(m => m.ObrasEditComponent),
  },
  {
    path: 'obras/:id',
    loadComponent: () =>
      import('./features/pages/obras-detail/obras-detail.component').then(m => m.ObrasDetailComponent),
  },
];

