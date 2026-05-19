import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ReportFilter, DeudasGlobalesResponse, CatalogoCuentaCorriente, DetalleDeudaCliente, DetalleDeudaProveedor } from '../../../core/models/models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { GenericFilterBarComponent, FilterDefinition, FilterAction } from '../generic-filter-bar/generic-filter-bar.component';

@Component({
  selector: 'app-cuentas-corrientes-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TooltipModule,
    GenericFilterBarComponent
  ],
  templateUrl: './cuentas-corrientes-list.component.html',
  styleUrls: ['./cuentas-corrientes-list.component.css']
})
export class CuentasCorrientesListComponent implements OnInit, OnDestroy {
  loading = false;
  generandoPdf = false;
  datosCargados = false;
  datos: DeudasGlobalesResponse | null = null;
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];
  currentFilters: Record<string, any> = {};
  grupos: Array<{ id: number; nombre: string }> = [];
  obras: Array<{ id: number; nombre: string }> = [];
  clientes: Array<{ id: number; nombre: string }> = [];
  proveedores: Array<{ id: number; nombre: string }> = [];

  @Output() clienteRowClicked = new EventEmitter<DetalleDeudaCliente>();
  @Output() proveedorRowClicked = new EventEmitter<DetalleDeudaProveedor>();

  private subs = new Subscription();
  private catalogoUrl = `${environment.apiGateway}/bff/reportes/catalogos/filtros-cuenta-corriente`;
  private deudasUrl = `${environment.apiGateway}/bff/reportes/financieros/deudas-globales`;
  private pdfUrl = `${environment.apiGateway}/bff/reportes/financieros/cuentas-corrientes-combinadas-pdf`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setupFilterActions();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setupFilterActions(): void {
    this.filterActions = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'info',
        callback: () => this.exportarPdf()
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.cargar();
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.cargar();
  }

  private cargarCatalogos(): void {
    this.subs.add(
      this.http.get<CatalogoCuentaCorriente>(this.catalogoUrl).subscribe({
        next: (response) => {
          this.grupos = response.grupos || [];
          this.obras = response.obras || [];
          this.clientes = response.clientes || [];
          this.proveedores = response.proveedores || [];
          this.setupFilterDefinitions();
          this.cargar();
        },
        error: (err) => {
          console.error('Error al cargar catálogos', err);
          this.setupFilterDefinitions();
          this.cargar();
        }
      })
    );
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      {
        key: 'clienteId',
        label: 'Cliente',
        type: 'select',
        placeholder: 'Todos',
        options: this.clientes.map((c) => ({ label: c.nombre, value: c.id }))
      },
      {
        key: 'proveedorId',
        label: 'Proveedor',
        type: 'select',
        placeholder: 'Todos',
        options: this.proveedores.map((p) => ({ label: p.nombre, value: p.id }))
      },
      {
        key: 'obraId',
        label: 'Obra',
        type: 'select',
        placeholder: 'Todas',
        options: this.obras.map((o) => ({ label: o.nombre, value: o.id }))
      }
    ];
  }

  private cargar(): void {
    this.loading = true;
    const filtro: ReportFilter = {
      grupoId: this.currentFilters['grupoId'],
      obraId: this.currentFilters['obraId'],
      clienteId: this.currentFilters['clienteId'],
      proveedorId: this.currentFilters['proveedorId']
    };

    this.subs.add(
      this.http.post<DeudasGlobalesResponse>(this.deudasUrl, filtro).subscribe({
        next: (response) => {
          this.datos = response;
          this.loading = false;
          this.datosCargados = true;
        },
        error: (err) => {
          console.error('Error al cargar cuentas corrientes', err);
          this.loading = false;
          this.datosCargados = true;
        }
      })
    );
  }

  getRangeClientes(): number[] {
    if (!this.datos?.detalleDeudaClientes) return [];
    return Array.from({ length: this.datos.detalleDeudaClientes.length }, (_, i) => i);
  }

  getRangeProveedores(): number[] {
    if (!this.datos?.detalleDeudaProveedores) return [];
    return Array.from({ length: this.datos.detalleDeudaProveedores.length }, (_, i) => i);
  }

  onClienteRowClick(item: DetalleDeudaCliente): void {
    this.clienteRowClicked.emit(item);
  }

  onProveedorRowClick(item: DetalleDeudaProveedor): void {
    this.proveedorRowClicked.emit(item);
  }

  private exportarPdf(): void {
    if (this.generandoPdf) return;

    this.generandoPdf = true;
    const pdfAction = this.filterActions.find((a) => a.label === 'Exportar PDF');
    if (pdfAction) pdfAction.loading = true;

    const filtro: ReportFilter = {
      grupoId: this.currentFilters['grupoId'],
      obraId: this.currentFilters['obraId'],
      clienteId: this.currentFilters['clienteId'],
      proveedorId: this.currentFilters['proveedorId']
    };

    this.subs.add(
      this.http.post(this.pdfUrl, filtro, { responseType: 'blob' }).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `CuentasCorrientesCombinadas_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.generandoPdf = false;
          if (pdfAction) pdfAction.loading = false;
        },
        error: (err) => {
          console.error('Error al exportar PDF', err);
          this.generandoPdf = false;
          if (pdfAction) pdfAction.loading = false;
        }
      })
    );
  }
}
