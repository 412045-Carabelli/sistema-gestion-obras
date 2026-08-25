import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { ReportesService } from '../../../services/reportes/reportes.service';
import { DetalleDeudaCliente, DetalleDeudaProveedor, ReportFilter } from '../../../core/models/models';

interface ResumenCliente {
  clienteId?: number;
  clienteNombre: string;
  presupuesto: number;
  cobrado: number;
  saldo: number;
}

interface ResumenProveedor {
  proveedorId?: number;
  proveedorNombre: string;
  presupuestado: number;
  pagado: number;
  saldo: number;
}

@Component({
  selector: 'app-resumen-obras',
  templateUrl: './resumen-obras.component.html',
  styleUrls: ['./resumen-obras.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule, TooltipModule]
})
export class ResumenObrasComponent implements OnInit, OnChanges, OnDestroy {
  @Input() filtro: ReportFilter | undefined;

  resumenClientes: ResumenCliente[] = [];
  resumenProveedores: ResumenProveedor[] = [];
  loading = false;

  private subs = new Subscription();

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtro'] && !changes['filtro'].firstChange) {
      this.cargarDatos();
    }
  }

  private cargarDatos(): void {
    this.loading = true;
    this.subs.add(
      this.reportesService.getDeudasGlobales(this.filtro ?? {}).subscribe({
        next: (data) => {
          this.resumenClientes = this.agruparPorCliente(data.detalleDeudaClientes || []);
          this.resumenProveedores = this.agruparPorProveedor(data.detalleDeudaProveedores || []);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar resumen de obras', err);
          this.loading = false;
        }
      })
    );
  }

  private agruparPorCliente(detalle: DetalleDeudaCliente[]): ResumenCliente[] {
    const porCliente = new Map<number, ResumenCliente>();
    detalle.forEach(item => {
      const clienteId = Number(item.clienteId ?? 0);
      const actual = porCliente.get(clienteId) || {
        clienteId,
        clienteNombre: item.clienteNombre || 'Sin cliente',
        presupuesto: 0,
        cobrado: 0,
        saldo: 0
      };
      actual.presupuesto += Number(item.presupuesto ?? 0);
      actual.cobrado += Number(item.cobrado ?? 0);
      actual.saldo += Number(item.saldo ?? 0);
      porCliente.set(clienteId, actual);
    });
    return Array.from(porCliente.values()).sort((a, b) => b.saldo - a.saldo);
  }

  private agruparPorProveedor(detalle: DetalleDeudaProveedor[]): ResumenProveedor[] {
    const porProveedor = new Map<number, ResumenProveedor>();
    detalle.forEach(item => {
      const proveedorId = Number(item.proveedorId ?? 0);
      const actual = porProveedor.get(proveedorId) || {
        proveedorId,
        proveedorNombre: item.proveedorNombre || 'Sin proveedor',
        presupuestado: 0,
        pagado: 0,
        saldo: 0
      };
      actual.presupuestado += Number(item.presupuestado ?? 0);
      actual.pagado += Number(item.pagado ?? 0);
      actual.saldo += Number(item.saldo ?? 0);
      porProveedor.set(proveedorId, actual);
    });
    return Array.from(porProveedor.values()).sort((a, b) => b.saldo - a.saldo);
  }

  get totalPresupuestadoClientes(): number {
    return this.resumenClientes.reduce((sum, o) => sum + (o.presupuesto || 0), 0);
  }

  get totalCobrosClientes(): number {
    return this.resumenClientes.reduce((sum, o) => sum + (o.cobrado || 0), 0);
  }

  get totalSaldoClientes(): number {
    return this.resumenClientes.reduce((sum, o) => sum + (o.saldo || 0), 0);
  }

  get totalCostosProveedores(): number {
    return this.resumenProveedores.reduce((sum, o) => sum + (o.presupuestado || 0), 0);
  }

  get totalPagosProveedores(): number {
    return this.resumenProveedores.reduce((sum, o) => sum + (o.pagado || 0), 0);
  }

  get totalSaldoProveedores(): number {
    return this.resumenProveedores.reduce((sum, o) => sum + (o.saldo || 0), 0);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
