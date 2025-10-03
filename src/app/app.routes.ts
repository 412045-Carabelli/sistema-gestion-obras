import { Routes } from '@angular/router';
import {ObrasComponent} from './features/pages/obras/obras.component';
import {ObrasDetailComponent} from './features/pages/obras-detail/obras-detail.component';
import {ObrasCreateComponent} from './features/pages/obras-create/obras-create.component';
import {ObrasEditComponent} from './features/pages/obras-edit/obras-edit.component';

export const routes: Routes = [
  {
    path: '',
    component: ObrasComponent,
  },
  {
    path: 'obras',
    component: ObrasComponent,
  },
  {
    path: 'obras/nueva',
    component: ObrasCreateComponent,
  },
  {
    path: 'obras/editar/:id',
    component: ObrasEditComponent,
  },
  {
    path: 'obras/:id',
    component: ObrasDetailComponent,
  },
];
