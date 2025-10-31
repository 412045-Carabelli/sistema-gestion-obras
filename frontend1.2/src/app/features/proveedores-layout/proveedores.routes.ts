import { Routes } from '@angular/router';
import { ProveedoresLayoutComponent } from './proveedores-layout.component';
import { ProveedoresListComponent } from '../components/proveedores-list/proveedores-list.component';
import { ProveedoresCreateComponent } from '../pages/proveedores-create/proveedores-create.component';
import { ProveedoresDetailComponent } from '../pages/proveedores-detail/proveedores-detail.component';
import { ProveedoresEditComponent } from '../pages/proveedores-edit/proveedores-edit.component';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    component: ProveedoresLayoutComponent,
    children: [
      { path: '', component: ProveedoresListComponent },
      { path: 'nueva', component: ProveedoresCreateComponent },
      { path: ':id', component: ProveedoresDetailComponent },
      { path: 'editar/:id', component: ProveedoresEditComponent },
    ],
  },
];
