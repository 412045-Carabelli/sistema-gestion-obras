import { Routes } from '@angular/router';
import { ClientesLayoutComponent } from './clientes-layout.component';
import { ClientesListComponent } from '../components/clientes-list/clientes-list.component';
import { ClientesCreateComponent } from '../pages/clientes-create/clientes-create.component';
import { ClientesDetailComponent } from '../pages/clientes-detail/clientes-detail.component';
import { ClientesEditComponent } from '../pages/clientes-edit/clientes-edit.component';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    component: ClientesLayoutComponent,
    children: [
      { path: '', component: ClientesListComponent },
      { path: 'nueva', component: ClientesCreateComponent },
      { path: ':id', component: ClientesDetailComponent },
      { path: 'editar/:id', component: ClientesEditComponent },
    ],
  },
];
