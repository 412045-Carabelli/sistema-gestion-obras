import { Component } from '@angular/core';
import { CuentasCorrientesListComponent } from '../../components/cuentas-corrientes-list/cuentas-corrientes-list.component';

@Component({
  selector: 'app-cuenta-corriente',
  standalone: true,
  imports: [CuentasCorrientesListComponent],
  template: '<app-cuentas-corrientes-list></app-cuentas-corrientes-list>'
})
export class CuentaCorrienteComponent {}
