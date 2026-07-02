import {Routes} from '@angular/router';
import {authGuard, authMatchGuard, adminGuard} from './core/guards/auth.guard';
import {planGuard} from './core/guards/plan.guard';
import {ConfiguracionLayoutComponent} from './features/pages/configuracion/configuracion-layout.component';
import {ConfiguracionComponent} from './features/pages/configuracion/configuracion.component';
import {UsuariosAdminComponent} from './features/pages/configuracion/usuarios-admin/usuarios-admin.component';
import {ObrasCreateComponent} from './features/pages/obras-create/obras-create.component';
import {ObrasLayoutComponent} from './features/obras-layout/obras-layout.component';
import {ObrasDetailComponent} from './features/pages/obras-detail/obras-detail.component';
import {ObrasEditComponent} from './features/pages/obras-edit/obras-edit.component';
import {ClientesLayoutComponent} from './features/clientes-layout/clientes-layout.component';
import {ClientesListComponent} from './features/components/clientes-list/clientes-list.component';
import {ClientesCreateComponent} from './features/pages/clientes-create/clientes-create.component';
import {ClientesDetailComponent} from './features/pages/clientes-detail/clientes-detail.component';
import {ClientesEditComponent} from './features/pages/clientes-edit/clientes-edit.component';
import {ProveedoresLayoutComponent} from './features/proveedores-layout/proveedores-layout.component';
import {ProveedoresCreateComponent} from './features/pages/proveedores-create/proveedores-create.component';
import {ProveedoresEditComponent} from './features/pages/proveedores-edit/proveedores-edit.component';
import {ProveedoresListComponent} from './features/components/proveedores-list/proveedores-list.component';
import {ReportesComponent} from './features/pages/reportes/reportes.component';
import {ProveedoresDetailComponent} from './features/pages/proveedores-detail/proveedores-detail.component';
import {ObrasListComponent} from './features/components/obra-list/obras-list.component';
import {FacturasLayoutComponent} from './features/facturas-layout/facturas-layout.component';
import {FacturasListComponent} from './features/components/facturas-list/facturas-list.component';
import {FacturasCreateComponent} from './features/pages/facturas-create/facturas-create.component';
import {FacturasDetailComponent} from './features/pages/facturas-detail/facturas-detail.component';
import {FacturasEditComponent} from './features/pages/facturas-edit/facturas-edit.component';
import {AgendasLayoutComponent} from './features/agendas-layout/agendas-layout.component';
import {AgendasListComponent} from './features/components/agendas-list/agendas-list.component';
import {AgendasGanttComponent} from './features/components/agendas-gantt/agendas-gantt.component';
import {GruposLayoutComponent} from './features/grupos-layout/grupos-layout.component';
import {GruposObrasComponent} from './features/pages/grupos-obras/grupos-obras.component';
import {CuentaCorrienteLayoutComponent} from './features/cuenta-corriente-layout/cuenta-corriente-layout.component';
import {CuentaCorrienteComponent} from './features/pages/cuenta-corriente/cuenta-corriente.component';
import {MovimientosLayoutComponent} from './features/movimientos-layout/movimientos-layout.component';
import {MovimientosListComponent} from './features/components/movimientos-list/movimientos-list.component';

export const routes: Routes = [
  // Root: redirect según autenticación
  {
    path: '',
    redirectTo: (route) => {
      const token = localStorage.getItem('sgo_access_token');
      return token ? '/dashboard' : '/home';
    },
    pathMatch: 'full'
  },

  // Landing publica
  {
    path: 'home',
    loadComponent: () => import('./features/pages/landing/landing.component')
      .then(m => m.LandingComponent)
  },

  // Auth routes (publicas)
  {
    path: 'login',
    loadComponent: () => import('./features/pages/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/pages/register/register.component')
      .then(m => m.RegisterComponent)
  },

  // Legal pages (publicas)
  {
    path: 'terminos',
    loadComponent: () => import('./features/pages/legal/terms.component')
      .then(m => m.TermsComponent)
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./features/pages/legal/privacy.component')
      .then(m => m.PrivacyComponent)
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./features/pages/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canMatch: [authMatchGuard],
    canActivate: [authGuard]
  },
  {
    path: 'tareas',
    loadComponent: () => import('./features/pages/tareas/tareas.component')
      .then(m => m.TareasComponent),
    canMatch: [authMatchGuard],
    canActivate: [authGuard]
  },
  {
    path: 'obras',
    component: ObrasLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      {path: '', component: ObrasListComponent},
      {path: 'nueva', component: ObrasCreateComponent},
      {path: ':id', component: ObrasDetailComponent},
      {path: 'editar/:id', component: ObrasEditComponent},
    ],
  },
  {
    path: 'clientes',
    component: ClientesLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      {path: '', component: ClientesListComponent},
      {path: 'nueva', component: ClientesCreateComponent},
      {path: ':id', component: ClientesDetailComponent},
      {path: 'editar/:id', component: ClientesEditComponent},
    ],
  },
  {
    path: 'proveedores',
    component: ProveedoresLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      {path: '', component: ProveedoresListComponent},
      {path: 'nueva', component: ProveedoresCreateComponent},
      {path: ':id', component: ProveedoresDetailComponent},
      {path: 'editar/:id', component: ProveedoresEditComponent},
    ],
  },
  {
    path: 'facturas',
    component: FacturasLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard, planGuard('facturas')],
    children: [
      {path: '', component: FacturasListComponent},
      {path: 'nueva', component: FacturasCreateComponent},
      {path: ':id', component: FacturasDetailComponent},
      {path: 'editar/:id', component: FacturasEditComponent},
    ],
  },
  {
    path: 'agendas',
    component: AgendasLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard, planGuard('agenda')],
    children: [
      {path: '', component: AgendasListComponent},
      {path: 'gantt', component: AgendasGanttComponent},
    ],
  },
  {path: 'reportes', component: ReportesComponent, canMatch: [authMatchGuard], canActivate: [authGuard]},
  {
    path: 'grupos',
    component: GruposLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard, planGuard('grupos_obras')],
    children: [
      {path: '', component: GruposObrasComponent},
    ],
  },
  {
    path: 'cuentas-corrientes',
    component: CuentaCorrienteLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      {path: '', component: CuentaCorrienteComponent},
    ],
  },
  {
    path: 'movimientos',
    component: MovimientosLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      {path: '', component: MovimientosListComponent},
    ],
  },
  {
    path: 'configuracion',
    component: ConfiguracionLayoutComponent,
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    children: [
      { path: '', component: ConfiguracionComponent },
      {
        path: '',
        canActivateChild: [adminGuard],
        children: [
          { path: 'usuarios', component: UsuariosAdminComponent }
        ]
      }
    ]
  },
  {
    path: 'planes',
    loadComponent: () => import('./features/pages/planes/planes.component').then(m => m.PlanesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mi-plan',
    loadComponent: () => import('./features/pages/mi-plan/mi-plan.component').then(m => m.MiPlanComponent),
    canActivate: [authGuard],
  },
  {path: '**', redirectTo: ''},
];
