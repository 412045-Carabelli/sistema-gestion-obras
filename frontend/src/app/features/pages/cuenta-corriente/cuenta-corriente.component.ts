import { Component, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CuentasCorrientesListComponent } from '../../components/cuentas-corrientes-list/cuentas-corrientes-list.component';
import { DetalleDeudaCliente, DetalleDeudaProveedor, CuentaCorrienteClienteResponse, CuentaCorrienteProveedorResponse } from '../../../core/models/models';
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
      [style]="{ width: '90vw' }"
      [breakpoints]="{ '960px': '95vw', '640px': '98vw' }"
      [showHeader]="true"
      [header]="'Historial - ' + (clienteSeleccionado?.clienteNombre || 'Cliente')"
      [closeOnEscape]="true"
      [maximizable]="true"
    >
      <div class="flex flex-col h-full">
        <!-- Info resumida -->
        <div class="mb-4 pb-3 border-b border-gray-200">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Obra</p>
              <p class="text-gray-900 font-bold text-base">{{ clienteSeleccionado?.obraNombre }}</p>
            </div>
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Presupuesto</p>
              <p class="text-gray-900 font-bold text-base">{{ clienteSeleccionado?.presupuesto | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
            </div>
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Saldo por Cobrar</p>
              <p class="text-blue-700 font-bold text-lg">{{ clienteSeleccionado?.saldo | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
            </div>
          </div>
        </div>

        @if (cargandoModalCliente) {
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <p class="text-gray-500 text-sm">Cargando...</p>
            </div>
          </div>
        }

        @if (!cargandoModalCliente && cuentaCorrienteCliente) {
          <!-- Tabla pivot: filas = obras, columnas = fechas -->
          <div class="flex-1 overflow-auto border border-gray-300 rounded-lg">
            <table class="w-full divide-x divide-gray-400">
              <thead class="bg-gray-100 border-b border-gray-400 sticky top-0">
                <tr class="divide-x divide-gray-400">
                  <th class="text-left px-4 py-3 font-bold text-gray-800 text-sm">Obra</th>
                  @for (fecha of getPivotFechasCliente(); track fecha) {
                    <th class="text-right px-3 py-3 font-bold text-gray-800 text-xs whitespace-nowrap">{{ formatearFecha(fecha) }}</th>
                  }
                  <th class="text-right px-3 py-3 font-bold text-gray-800 text-xs whitespace-nowrap bg-blue-50">Saldo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                @for (fila of getPivotFilasCliente(); track fila.obraNombre) {
                  <tr class="hover:bg-gray-50 transition-colors divide-x divide-gray-400">
                    <td class="px-4 py-3 font-bold text-gray-900 text-sm">{{ fila.obraNombre }}</td>
                    @for (fecha of getPivotFechasCliente(); track fecha) {
                      <td class="px-3 py-3 text-right">
                        @if (fila.movimientosPorFecha[fecha]) {
                          <span class="text-green-700 font-semibold text-sm">{{ fila.movimientosPorFecha[fecha] | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                        } @else {
                          <span class="text-gray-300 text-sm">—</span>
                        }
                      </td>
                    }
                    <td class="px-3 py-3 text-right font-bold text-blue-700 text-sm bg-blue-50 whitespace-nowrap">
                      {{ fila.saldo | currency:'ARS':'symbol-narrow':'1.0-0' }}
                    </td>
                  </tr>
                }
                @if (!getPivotFilasCliente().length) {
                  <tr><td [attr.colspan]="getPivotFechasCliente().length + 2" class="px-4 py-8 text-center text-gray-400">Sin movimientos registrados.</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex justify-between items-center">
              <div class="flex gap-6 text-sm text-gray-600">
                <span>Total cobrado: <strong class="text-green-700">{{ cuentaCorrienteCliente.totalCobros | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong></span>
              </div>
              <div class="text-right">
                <p class="text-green-700 text-xs font-medium">SALDO FINAL</p>
                <p class="text-2xl font-bold text-green-700">{{ cuentaCorrienteCliente.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </p-dialog>

    <!-- Modal Proveedor -->
    <p-dialog
      [(visible)]="mostrarModalProveedor"
      [modal]="true"
      [style]="{ width: '90vw' }"
      [breakpoints]="{ '960px': '95vw', '640px': '98vw' }"
      [showHeader]="true"
      [header]="'Historial - ' + (proveedorSeleccionado?.proveedorNombre || 'Proveedor')"
      [closeOnEscape]="true"
      [maximizable]="true"
    >
      <div class="flex flex-col h-full">
        <!-- Info resumida -->
        <div class="mb-4 pb-3 border-b border-gray-200">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Obra</p>
              <p class="text-gray-900 font-bold text-base">{{ proveedorSeleccionado?.obraNombre }}</p>
            </div>
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Presupuestado</p>
              <p class="text-gray-900 font-bold text-base">{{ proveedorSeleccionado?.presupuestado | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
            </div>
            <div>
              <p class="text-gray-500 font-medium text-xs mb-2">Saldo por Pagar</p>
              <p class="text-orange-700 font-bold text-lg">{{ proveedorSeleccionado?.saldo | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
            </div>
          </div>
        </div>

        @if (cargandoModalProveedor) {
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
              <p class="text-gray-500 text-sm">Cargando...</p>
            </div>
          </div>
        }

        @if (!cargandoModalProveedor && cuentaCorrienteProveedor) {
          <!-- Tabla pivot: filas = obras, columnas = fechas -->
          <div class="flex-1 overflow-auto border border-gray-300 rounded-lg">
            <table class="w-full divide-x divide-gray-400">
              <thead class="bg-gray-100 border-b border-gray-400 sticky top-0">
                <tr class="divide-x divide-gray-400">
                  <th class="text-left px-4 py-3 font-bold text-gray-800 text-sm">Obra</th>
                  @for (fecha of getPivotFechasProveedor(); track fecha) {
                    <th class="text-right px-3 py-3 font-bold text-gray-800 text-xs whitespace-nowrap">{{ formatearFecha(fecha) }}</th>
                  }
                  <th class="text-right px-3 py-3 font-bold text-gray-800 text-xs whitespace-nowrap bg-orange-50">Saldo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                @for (fila of getPivotFilasProveedor(); track fila.obraNombre) {
                  <tr class="hover:bg-gray-50 transition-colors divide-x divide-gray-400">
                    <td class="px-4 py-3 font-bold text-gray-900 text-sm">{{ fila.obraNombre }}</td>
                    @for (fecha of getPivotFechasProveedor(); track fecha) {
                      <td class="px-3 py-3 text-right">
                        @if (fila.movimientosPorFecha[fecha]) {
                          <span class="font-semibold text-sm"
                            [class.text-red-700]="fila.movimientosPorFecha[fecha] > 0"
                            [class.text-green-700]="fila.movimientosPorFecha[fecha] < 0">
                            {{ fila.movimientosPorFecha[fecha] | currency:'ARS':'symbol-narrow':'1.0-0' }}
                          </span>
                        } @else {
                          <span class="text-gray-300 text-sm">—</span>
                        }
                      </td>
                    }
                    <td class="px-3 py-3 text-right font-bold text-orange-700 text-sm bg-orange-50 whitespace-nowrap">
                      {{ fila.saldo | currency:'ARS':'symbol-narrow':'1.0-0' }}
                    </td>
                  </tr>
                }
                @if (!getPivotFilasProveedor().length) {
                  <tr><td [attr.colspan]="getPivotFechasProveedor().length + 2" class="px-4 py-8 text-center text-gray-400">Sin movimientos registrados.</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div class="flex justify-between items-center">
              <div class="flex gap-6 text-sm text-gray-600">
                <span>Total costos: <strong class="text-red-700">{{ cuentaCorrienteProveedor.totalCostos | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong></span>
                <span>Total pagado: <strong class="text-green-700">{{ cuentaCorrienteProveedor.totalPagos | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong></span>
              </div>
              <div class="text-right">
                <p class="text-orange-700 text-xs font-medium">SALDO FINAL</p>
                <p class="text-2xl font-bold text-orange-700">{{ cuentaCorrienteProveedor.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </p-dialog>
  `
})
export class CuentaCorrienteComponent implements OnDestroy {
  mostrarModalCliente = false;
  mostrarModalProveedor = false;
  clienteSeleccionado: DetalleDeudaCliente | null = null;
  proveedorSeleccionado: DetalleDeudaProveedor | null = null;

  cuentaCorrienteCliente: CuentaCorrienteClienteResponse | null = null;
  cuentaCorrienteProveedor: CuentaCorrienteProveedorResponse | null = null;
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
        this.reportesService.getCuentaCorrienteCliente({ clienteId: item.clienteId, obraIds: [item.obraId] }).subscribe({
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
        this.reportesService.getCuentaCorrienteProveedor({ proveedorId: item.proveedorId, obraIds: [item.obraId] }).subscribe({
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

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('es-AR');
  }

  getPivotFechasCliente(): string[] {
    if (!this.cuentaCorrienteCliente?.movimientos?.length) return [];
    const fechas = new Set<string>();
    for (const mov of this.cuentaCorrienteCliente.movimientos) {
      if (mov.fecha) fechas.add(mov.fecha.substring(0, 10));
    }
    return Array.from(fechas).sort();
  }

  getPivotFilasCliente(): Array<{ obraNombre: string; movimientosPorFecha: Record<string, number>; saldo: number }> {
    if (!this.cuentaCorrienteCliente?.movimientos?.length) return [];
    const obraMap = new Map<string, Record<string, number>>();
    for (const mov of this.cuentaCorrienteCliente.movimientos) {
      const obra = mov.obraNombre || 'Sin obra';
      const fecha = mov.fecha?.substring(0, 10) || '';
      if (!obraMap.has(obra)) obraMap.set(obra, {});
      const entry = obraMap.get(obra)!;
      entry[fecha] = (entry[fecha] || 0) + mov.monto;
    }
    return Array.from(obraMap.entries()).map(([obraNombre, movimientosPorFecha]) => ({
      obraNombre,
      movimientosPorFecha,
      saldo: Object.values(movimientosPorFecha).reduce((a, b) => a + b, 0)
    }));
  }

  getPivotFechasProveedor(): string[] {
    if (!this.cuentaCorrienteProveedor?.movimientos?.length) return [];
    const fechas = new Set<string>();
    for (const mov of this.cuentaCorrienteProveedor.movimientos) {
      if (mov.fecha) fechas.add(mov.fecha.substring(0, 10));
    }
    return Array.from(fechas).sort();
  }

  getPivotFilasProveedor(): Array<{ obraNombre: string; movimientosPorFecha: Record<string, number>; saldo: number }> {
    if (!this.cuentaCorrienteProveedor?.movimientos?.length) return [];
    const obraMap = new Map<string, Record<string, number>>();
    for (const mov of this.cuentaCorrienteProveedor.movimientos) {
      const obra = mov.obraNombre || 'Sin obra';
      const fecha = mov.fecha?.substring(0, 10) || '';
      if (!obraMap.has(obra)) obraMap.set(obra, {});
      const entry = obraMap.get(obra)!;
      entry[fecha] = (entry[fecha] || 0) + mov.monto;
    }
    return Array.from(obraMap.entries()).map(([obraNombre, movimientosPorFecha]) => ({
      obraNombre,
      movimientosPorFecha,
      saldo: Object.values(movimientosPorFecha).reduce((a, b) => a + b, 0)
    }));
  }
}
