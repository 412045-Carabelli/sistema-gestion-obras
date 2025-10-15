import { Routes } from '@angular/router';
import {ObrasCreateComponent} from './features/pages/obras-create/obras-create.component';
import {ObrasLayoutComponent} from './features/obras-layout/obras-layout.component';
import {ObrasDetailComponent} from './features/pages/obras-detail/obras-detail.component';
import {ObrasListComponent} from './features/components/obra-list/obras-list.component';
import {ObrasEditComponent} from './features/pages/obras-edit/obras-edit.component';
import {ClientesLayoutComponent} from './features/clientes-layout/clientes-layout.component';
import {ClientesListComponent} from './features/components/clientes-list/clientes-list.component';
import {ClientesCreateComponent} from './features/pages/clientes-create/clientes-create.component';
import {ClientesDetailComponent} from './features/pages/clientes-detail/clientes-detail.component';
import {ClientesEditComponent} from './features/pages/clientes-edit/clientes-edit.component';
import {ProveedoresLayoutComponent} from './features/proveedores-layout/proveedores-layout.component';
import {ProveedoresCreateComponent} from './features/pages/proveedores-create/proveedores-create.component';
import {ProveedoresDetailComponent} from './features/pages/proveedores-detail/proveedores-detail.component';
import {ProveedoresEditComponent} from './features/pages/proveedores-edit/proveedores-edit.component';
import {ProveedoresListComponent} from './features/components/proveedores-list/proveedores-list.component';

export const routes: Routes = [
  {
    path: 'obras',
    component: ObrasLayoutComponent,
    children: [
      { path: '', component: ObrasListComponent },
      { path: 'nueva', component: ObrasCreateComponent },
      { path: ':id', component: ObrasDetailComponent },
      { path: 'editar/:id', component: ObrasEditComponent },
    ],
  },
  {
    path: 'clientes',
    component: ClientesLayoutComponent,
    children: [
      { path: '', component: ClientesListComponent },
      { path: 'nueva', component: ClientesCreateComponent },
      { path: ':id', component: ClientesDetailComponent },
      { path: 'editar/:id', component: ClientesEditComponent },
    ],
  },
  {
    path: 'proveedores',
    component: ProveedoresLayoutComponent,
    children: [
      { path: '', component: ProveedoresListComponent },
      { path: 'nueva', component: ProveedoresCreateComponent },
      { path: ':id', component: ProveedoresDetailComponent },
      { path: 'editar/:id', component: ProveedoresEditComponent },
    ],
  },
  { path: '', redirectTo: 'obras', pathMatch: 'full' },
  { path: '**', redirectTo: 'obras' },
];
