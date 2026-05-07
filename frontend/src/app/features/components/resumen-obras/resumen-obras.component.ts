import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import { ReportesService } from '../../../services/reportes/reportes.service';
import { DetalleDeudaCliente, DetalleDeudaProveedor } from '../../../core/models/models';

@Component({
  selector: 'app-resumen-obras',
  templateUrl: './resumen-obras.component.html',
  styleUrls: ['./resumen-obras.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule]
})
export class ResumenObrasComponent implements OnInit, OnDestroy {
  obrasClientes: DetalleDeudaCliente[] = [];
  obrasProveedores: DetalleDeudaProveedor[] = [];
  loading = false;

  private subs = new Subscription();

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading = true;
    this.subs.add(
      this.reportesService.getDeudasGlobales({}).subscribe({
        next: (data) => {
          this.obrasClientes = data.detalleDeudaClientes || [];
          this.obrasProveedores = data.detalleDeudaProveedores || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar resumen de obras', err);
          this.loading = false;
        }
      })
    );
  }

  get totalPresupuestadoClientes(): number {
    return this.obrasClientes.reduce((sum, o) => sum + (o.presupuesto || 0), 0);
  }

  get totalCobrosClientes(): number {
    return this.obrasClientes.reduce((sum, o) => sum + (o.cobrado || 0), 0);
  }

  get totalSaldoClientes(): number {
    return this.obrasClientes.reduce((sum, o) => sum + (o.saldo || 0), 0);
  }

  get totalCostosProveedores(): number {
    return this.obrasProveedores.reduce((sum, o) => sum + (o.presupuestado || 0), 0);
  }

  get totalPagosProveedores(): number {
    return this.obrasProveedores.reduce((sum, o) => sum + (o.pagado || 0), 0);
  }

  get totalSaldoProveedores(): number {
    return this.obrasProveedores.reduce((sum, o) => sum + (o.saldo || 0), 0);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
