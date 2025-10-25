import { Routes } from '@angular/router';
import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'obras',
    loadChildren: () =>
      import('./features/obras-layout/obras.routes').then(m => m.OBRAS_ROUTES),
  },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./features/clientes-layout/clientes.routes').then(m => m.CLIENTES_ROUTES),
  },
  {
    path: 'proveedores',
    loadChildren: () =>
      import('./features/proveedores-layout/proveedores.routes').then(m => m.PROVEEDORES_ROUTES),
  },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
