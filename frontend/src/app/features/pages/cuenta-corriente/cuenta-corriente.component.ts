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
      [style]="{ width: '85vw' }"
      [breakpoints]="{ '960px': '90vw', '640px': '95vw' }"
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

        <!-- Tabla de movimientos -->
        @if (cargandoModalCliente) {
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <p class="text-gray-500 text-sm">Cargando...</p>
            </div>
          </div>
        }

        @if (!cargandoModalCliente && cuentaCorrienteCliente?.filas) {
          <div class="flex-1 overflow-auto border border-gray-300 rounded-lg">
            <table class="w-full divide-x divide-gray-400">
              <thead class="bg-gray-100 border-b border-gray-400 sticky top-0">
                <tr class="divide-x divide-gray-400">
                  <th class="text-left px-4 py-3 font-bold text-gray-800 text-base">Obra</th>
                  @for (fecha of getFechasUnicasCliente(); track fecha) {
                    <th class="text-right px-3 py-3 font-bold text-gray-800 text-sm whitespace-nowrap">{{ formatearFecha(fecha) }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                @for (fila of cuentaCorrienteCliente!.filas; track fila.obraNombre) {
                  <tr class="hover:bg-gray-50 transition-colors divide-x divide-gray-400">
                    <td class="px-4 py-3 font-bold text-gray-900 text-base">{{ fila.obraNombre }}</td>
                    @for (fecha of getFechasUnicasCliente(); track fecha) {
                      <td class="px-3 py-3 text-right">
                        @if (obtenerMovimiento(fila, fecha)) {
                          <span class="text-green-700 font-bold text-base">{{ obtenerMovimiento(fila, fecha) | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
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

          <!-- Saldo Final -->
          <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex justify-between items-center">
              <p class="text-green-700 font-medium">SALDO FINAL</p>
              <p class="text-2xl font-bold text-green-700">{{ cuentaCorrienteCliente?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
            </div>
          </div>
        }
      </div>
    </p-dialog>

    <!-- Modal Proveedor -->
    <p-dialog
      [(visible)]="mostrarModalProveedor"
      [modal]="true"
      [style]="{ width: '85vw' }"
      [breakpoints]="{ '960px': '90vw', '640px': '95vw' }"
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

        <!-- Tabla de movimientos -->
        @if (cargandoModalProveedor) {
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
              <p class="text-gray-500 text-sm">Cargando...</p>
            </div>
          </div>
        }

        @if (!cargandoModalProveedor && cuentaCorrienteProveedor?.filas) {
          <div class="flex-1 overflow-auto border border-gray-300 rounded-lg">
            <table class="w-full divide-x divide-gray-400">
              <thead class="bg-gray-100 border-b border-gray-400 sticky top-0">
                <tr class="divide-x divide-gray-400">
                  <th class="text-left px-4 py-3 font-bold text-gray-800 text-base">Obra</th>
                  @for (fecha of getFechasUnicasProveedor(); track fecha) {
                    <th class="text-right px-3 py-3 font-bold text-gray-800 text-sm whitespace-nowrap">{{ formatearFecha(fecha) }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                @for (fila of cuentaCorrienteProveedor!.filas; track fila.obraNombre) {
                  <tr class="hover:bg-gray-50 transition-colors divide-x divide-gray-400">
                    <td class="px-4 py-3 font-bold text-gray-900 text-base">{{ fila.obraNombre }}</td>
                    @for (fecha of getFechasUnicasProveedor(); track fecha) {
                      <td class="px-3 py-3 text-right">
                        @if (obtenerMovimiento(fila, fecha)) {
                          <span class="text-orange-700 font-bold text-base">{{ obtenerMovimiento(fila, fecha) | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
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

          <!-- Saldo Final -->
          <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div class="flex justify-between items-center">
              <p class="text-orange-700 font-medium">SALDO FINAL</p>
              <p class="text-2xl font-bold text-orange-700">{{ cuentaCorrienteProveedor?.saldoFinal | currency:'ARS':'symbol-narrow':'1.0-0' }}</p>
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

  getFechasUnicasCliente(): string[] {
    return this.cuentaCorrienteCliente?.fechasUnicas || [];
  }

  getFechasUnicasProveedor(): string[] {
    return this.cuentaCorrienteProveedor?.fechasUnicas || [];
  }

  formatearFecha(fecha: string): string {
    // Parsear fecha en formato YYYY-MM-DD sin problemas de zona horaria
    const [year, month, day] = fecha.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('es-AR');
  }

  obtenerMovimiento(fila: any, fecha: string): number | null {
    const movimiento = fila.movimientosPorFecha?.[fecha];
    return movimiento ? Number(movimiento) : null;
  }
}
