import { Routes } from '@angular/router';
import { ObrasLayoutComponent } from './obras-layout.component';
import { ObrasListComponent } from '../components/obra-list/obras-list.component';
import { ObrasCreateComponent } from '../pages/obras-create/obras-create.component';
import { ObrasDetailComponent } from '../pages/obras-detail/obras-detail.component';
import { ObrasEditComponent } from '../pages/obras-edit/obras-edit.component';
import { obrasListResolver } from './resolvers/obras.resolver';

export const OBRAS_ROUTES: Routes = [
  {
    path: '',
    component: ObrasLayoutComponent,
    children: [
      {
        path: '',
        component: ObrasListComponent,
        resolve: { obras: obrasListResolver }
      },
      { path: 'nueva', component: ObrasCreateComponent },
      { path: ':id', component: ObrasDetailComponent },
      { path: 'editar/:id', component: ObrasEditComponent },
    ],
  },
];
