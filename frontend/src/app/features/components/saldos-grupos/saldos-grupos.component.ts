import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Toast } from 'primeng/toast';
import { SaldosGruposService, SaldoGrupoCliente, SaldoGrupoProveedor } from '../../../services/saldos-grupos/saldos-grupos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-saldos-grupos',
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule, Toast],
  providers: [MessageService],
  templateUrl: './saldos-grupos.component.html',
  styleUrls: ['./saldos-grupos.component.css']
})
export class SaldosGruposComponent implements OnInit, OnDestroy {
  saldosProveedores: SaldoGrupoProveedor[] = [];
  saldosClientes: SaldoGrupoCliente[] = [];
  loading = false;
  private subs = new Subscription();

  constructor(
    private saldosGruposService: SaldosGruposService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarSaldos();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargarSaldos(): void {
    this.loading = true;
    this.subs.add(
      this.saldosGruposService.obtenerSaldosGruposProveedores().subscribe({
        next: (data) => {
          this.saldosProveedores = data;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los saldos de proveedores' });
          this.loading = false;
        }
      })
    );

    this.subs.add(
      this.saldosGruposService.obtenerSaldosGruposClientes().subscribe({
        next: (data) => {
          this.saldosClientes = data;
          this.loading = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los saldos de clientes' });
          this.loading = false;
        }
      })
    );
  }

  get totalPresupuestadoProveedores(): number {
    return this.saldosProveedores.reduce((sum, item) => sum + Number(item.total_costos ?? 0), 0);
  }

  get totalPagosProveedores(): number {
    return this.saldosProveedores.reduce((sum, item) => sum + Number(item.total_pagos ?? 0), 0);
  }

  get totalSaldoProveedores(): number {
    return this.saldosProveedores.reduce((sum, item) => sum + Number(item.saldo_pendiente ?? 0), 0);
  }

  get totalPresupuestadoClientes(): number {
    return this.saldosClientes.reduce((sum, item) => sum + Number(item.total_presupuesto ?? 0), 0);
  }

  get totalCobrosClientes(): number {
    return this.saldosClientes.reduce((sum, item) => sum + Number(item.total_cobros ?? 0), 0);
  }

  get totalSaldoClientes(): number {
    return this.saldosClientes.reduce((sum, item) => sum + Number(item.saldo_pendiente ?? 0), 0);
  }
}
