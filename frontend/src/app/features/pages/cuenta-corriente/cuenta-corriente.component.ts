import { Component, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CuentasCorrientesListComponent } from '../../components/cuentas-corrientes-list/cuentas-corrientes-list.component';
import { DetalleDeudaCliente, DetalleDeudaProveedor, CuentaCorrientePdfResponse } from '../../../core/models/models';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ReportesService } from '../../../services/reportes/reportes.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cuenta-corriente',
  standalone: true,
  imports: [CommonModule, CuentasCorrientesListComponent, DialogModule, ButtonModule, CurrencyPipe],
  template: `
    <app-cuentas-corrientes-list
      (clienteRowClicked)="abrirModalCliente($event)"
      (proveedorRowClicked)="abrirModalProveedor($event)"
    ></app-cuentas-corrientes-list>

    <!-- Modal Cliente -->
    <p-dialog
      [(visible)]="mostrarModalCliente"
      [modal]="true"
      [style]="{ width: '95vw', maxHeight: '95vh' }"
      [breakpoints]="{ '960px': '98vw', '640px': '100vw' }"
      [showHeader]="false"
      [closeOnEscape]="true"
      styleClass="custom-modal"
    >
      <ng-template pTemplate="content">
        <div class="h-full flex flex-col">
          <!-- Header con info principal -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-lg -mx-6 -mt-6 mb-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">MOVIMIENTOS POR COBRAR</p>
                <h2 class="text-2xl font-bold mt-1">{{ clienteSeleccionado?.clienteNombre }}</h2>
                <p class="text-blue-100 mt-2">{{ clienteSeleccionado?.obraNombre }}</p>
              </div>
              <div class="text-right">
                <p class="text-blue-100 text-sm font-medium mb-1">Saldo por Cobrar</p>
                <p class="text-3xl font-bold">{{ cuentaCorrienteCliente?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          </div>

          <!-- Tabla de movimientos -->
          @if (cargandoModalCliente) {
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p class="text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          }

          @if (!cargandoModalCliente && cuentaCorrienteCliente?.filas) {
            <div class="flex-1 overflow-auto rounded-lg border border-gray-200 shadow-sm">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <th class="text-left px-5 py-3 font-semibold text-gray-700 text-sm">Obra</th>
                    @for (fecha of getFechasUnicas(); track fecha) {
                      <th class="text-right px-4 py-3 font-semibold text-gray-700 text-sm whitespace-nowrap">
                        <div class="text-xs text-gray-500 font-normal">{{ formatearFecha(fecha) }}</div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (fila of cuentaCorrienteCliente!.filas; track fila.obraNombre) {
                    <tr class="hover:bg-blue-50 transition-colors">
                      <td class="px-5 py-4 font-medium text-gray-900">{{ fila.obraNombre }}</td>
                      @for (fecha of getFechasUnicas(); track fecha) {
                        <td class="px-4 py-4 text-right">
                          @if (obtenerMovimiento(fila, fecha)) {
                            <span class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {{ obtenerMovimiento(fila, fecha) | currency:'ARS':'symbol-narrow':'1.0-0' }}
                            </span>
                          } @else {
                            <span class="text-gray-300">—</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Footer con totales -->
            <div class="mt-6 grid grid-cols-3 gap-4">
              <div class="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-600 font-medium mb-1">Total Presupuestado</p>
                <p class="text-lg font-bold text-gray-900">{{ cuentaCorrienteCliente?.totalCostos | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
              <div class="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-600 font-medium mb-1">Total Cobrado</p>
                <p class="text-lg font-bold text-green-600">{{ cuentaCorrienteCliente?.totalPagos | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
              <div class="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <p class="text-xs text-blue-600 font-medium mb-1">Saldo Pendiente</p>
                <p class="text-lg font-bold text-blue-700">{{ cuentaCorrienteCliente?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          }
        </div>
      </ng-template>
    </p-dialog>

    <!-- Modal Proveedor -->
    <p-dialog
      [(visible)]="mostrarModalProveedor"
      [modal]="true"
      [style]="{ width: '95vw', maxHeight: '95vh' }"
      [breakpoints]="{ '960px': '98vw', '640px': '100vw' }"
      [showHeader]="false"
      [closeOnEscape]="true"
      styleClass="custom-modal"
    >
      <ng-template pTemplate="content">
        <div class="h-full flex flex-col">
          <!-- Header con info principal -->
          <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-5 rounded-t-lg -mx-6 -mt-6 mb-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-orange-100 text-sm font-medium">MOVIMIENTOS POR PAGAR</p>
                <h2 class="text-2xl font-bold mt-1">{{ proveedorSeleccionado?.proveedorNombre }}</h2>
                <p class="text-orange-100 mt-2">{{ proveedorSeleccionado?.obraNombre }}</p>
              </div>
              <div class="text-right">
                <p class="text-orange-100 text-sm font-medium mb-1">Saldo por Pagar</p>
                <p class="text-3xl font-bold">{{ cuentaCorrienteProveedor?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          </div>

          <!-- Tabla de movimientos -->
          @if (cargandoModalProveedor) {
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
                <p class="text-gray-500 font-medium">Cargando historial...</p>
              </div>
            </div>
          }

          @if (!cargandoModalProveedor && cuentaCorrienteProveedor?.filas) {
            <div class="flex-1 overflow-auto rounded-lg border border-gray-200 shadow-sm">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <th class="text-left px-5 py-3 font-semibold text-gray-700 text-sm">Obra</th>
                    @for (fecha of getFechasUnicas(); track fecha) {
                      <th class="text-right px-4 py-3 font-semibold text-gray-700 text-sm whitespace-nowrap">
                        <div class="text-xs text-gray-500 font-normal">{{ formatearFecha(fecha) }}</div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (fila of cuentaCorrienteProveedor!.filas; track fila.obraNombre) {
                    <tr class="hover:bg-orange-50 transition-colors">
                      <td class="px-5 py-4 font-medium text-gray-900">{{ fila.obraNombre }}</td>
                      @for (fecha of getFechasUnicas(); track fecha) {
                        <td class="px-4 py-4 text-right">
                          @if (obtenerMovimiento(fila, fecha)) {
                            <span class="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {{ obtenerMovimiento(fila, fecha) | currency:'ARS':'symbol-narrow':'1.0-0' }}
                            </span>
                          } @else {
                            <span class="text-gray-300">—</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Footer con totales -->
            <div class="mt-6 grid grid-cols-3 gap-4">
              <div class="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-600 font-medium mb-1">Total Presupuestado</p>
                <p class="text-lg font-bold text-gray-900">{{ cuentaCorrienteProveedor?.totalCostos | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
              <div class="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-600 font-medium mb-1">Total Pagado</p>
                <p class="text-lg font-bold text-green-600">{{ cuentaCorrienteProveedor?.totalPagos | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
              <div class="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <p class="text-xs text-orange-600 font-medium mb-1">Saldo Pendiente</p>
                <p class="text-lg font-bold text-orange-700">{{ cuentaCorrienteProveedor?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          }
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class CuentaCorrienteComponent implements OnDestroy {
  mostrarModalCliente = false;
  mostrarModalProveedor = false;
  clienteSeleccionado: DetalleDeudaCliente | null = null;
  proveedorSeleccionado: DetalleDeudaProveedor | null = null;

  cuentaCorrienteCliente: CuentaCorrientePdfResponse | null = null;
  cuentaCorrienteProveedor: CuentaCorrientePdfResponse | null = null;
  cargandoModalCliente = false;
  cargandoModalProveedor = false;

  private subs = new Subscription();

  constructor(private reportesService: ReportesService) {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  abrirModalCliente(item: DetalleDeudaCliente): void {
    this.clienteSeleccionado = item;
    this.cargandoModalCliente = true;
    this.cuentaCorrienteCliente = null;

    if (item.clienteId) {
      this.subs.add(
        this.reportesService.getCuentaCorrientePdfCliente(item.clienteId, [item.obraId]).subscribe({
          next: (data) => {
            this.cuentaCorrienteCliente = data;
            this.cargandoModalCliente = false;
          },
          error: () => {
            this.cargandoModalCliente = false;
          }
        })
      );
    }

    this.mostrarModalCliente = true;
  }

  abrirModalProveedor(item: DetalleDeudaProveedor): void {
    this.proveedorSeleccionado = item;
    this.cargandoModalProveedor = true;
    this.cuentaCorrienteProveedor = null;

    if (item.proveedorId) {
      this.subs.add(
        this.reportesService.getCuentaCorrientePdfProveedor(item.proveedorId, [item.obraId]).subscribe({
          next: (data) => {
            this.cuentaCorrienteProveedor = data;
            this.cargandoModalProveedor = false;
          },
          error: () => {
            this.cargandoModalProveedor = false;
          }
        })
      );
    }

    this.mostrarModalProveedor = true;
  }

  getFechasUnicas(): string[] {
    return this.cuentaCorrienteCliente?.fechasUnicas || this.cuentaCorrienteProveedor?.fechasUnicas || [];
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR');
  }

  obtenerMovimiento(fila: any, fecha: string): number | null {
    const movimiento = fila.movimientosPorFecha?.[fecha];
    return movimiento ? Number(movimiento) : null;
  }
}
