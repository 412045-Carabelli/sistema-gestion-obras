import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { Subscription, Subject } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-cuentas-corrientes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    TooltipModule
  ],
  templateUrl: './cuentas-corrientes-list.component.html',
  styleUrls: ['./cuentas-corrientes-list.component.css']
})
export class CuentasCorrientesListComponent implements OnInit, OnDestroy {
  loading = false;
  datos: DeudasGlobalesResponse | null = null;
  form!: FormGroup;
  grupos: Array<{ id: number; nombre: string }> = [];
  clientes: Array<{ id: number; nombre: string }> = [];

  // Listas completas
  private obrasTodas: Array<{ id: number; nombre: string }> = [];
  private clientesTodos: Array<{ id: number; nombre: string }> = [];
  private proveedoresTodos: Array<{ id: number; nombre: string }> = [];

  // Mapas de relaciones
  private clienteObras: Record<string, number[]> = {};
  private obraCliente: Record<string, number> = {};
  private obraProveedores: Record<string, number[]> = {};
  private proveedorObras: Record<string, number[]> = {};
  private clienteProveedores: Record<string, number[]> = {};

  // Listas filtradas dinámicamente
  obrasFiltradas: Array<{ id: number; nombre: string }> = [];
  clientesFiltrados: Array<{ id: number; nombre: string }> = [];
  proveedoresFiltrados: Array<{ id: number; nombre: string }> = [];

  @Output() clienteRowClicked = new EventEmitter<DetalleDeudaCliente>();
  @Output() proveedorRowClicked = new EventEmitter<DetalleDeudaProveedor>();

  private subs = new Subscription();
  private cargar$ = new Subject<void>();
  private catalogoUrl = `${environment.apiGateway}/bff/reportes/catalogos/filtros-cuenta-corriente`;
  private deudasUrl = `${environment.apiGateway}/bff/reportes/financieros/deudas-globales`;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setupCargarConSwitchMap();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.cargar$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      grupoId: [null],
      obraId: [null],
      clienteId: [null],
      proveedorId: [null]
    });
  }

  private setupCargarConSwitchMap(): void {
    // Usar switchMap para cancelar peticiones previas
    this.subs.add(
      this.cargar$.pipe(
        switchMap(() => {
          this.loading = true;
          return this.http.post<DeudasGlobalesResponse>(this.deudasUrl, this.buildFiltro()).pipe(
            catchError((err) => {
              console.error('Error al cargar cuentas corrientes', err);
              this.loading = false;
              return of(null);
            })
          );
        })
      ).subscribe((response) => {
        this.datos = response;
        this.loading = false;
      })
    );
  }

  private cargarCatalogos(): void {
    this.subs.add(
      this.http.get<CatalogoCuentaCorriente>(this.catalogoUrl).subscribe({
        next: (response) => {
          this.grupos = response.grupos || [];
          this.clientesTodos = response.clientes || [];
          this.obrasTodas = response.obras || [];
          this.proveedoresTodos = response.proveedores || [];

          // Guardar mapas de relaciones
          this.clienteObras = response.relaciones?.clienteObras || {};
          this.obraCliente = response.relaciones?.obraCliente || {};
          this.obraProveedores = response.relaciones?.obraProveedores || {};
          this.proveedorObras = response.relaciones?.proveedorObras || {};
          this.clienteProveedores = response.relaciones?.clienteProveedores || {};

          // Inicializar listas filtradas con todas las opciones
          this.clientesFiltrados = [...this.clientesTodos];
          this.obrasFiltradas = [...this.obrasTodas];
          this.proveedoresFiltrados = [...this.proveedoresTodos];

          this.setupListeners();
          this.cargar$.next();
        },
        error: (err) => {
          console.error('Error al cargar catálogos', err);
          this.cargar$.next();
        }
      })
    );
  }

  private setupListeners(): void {
    // Escuchar cambios en cualquier filtro y recalcular todos
    this.subs.add(
      this.form.get('clienteId')!.valueChanges.subscribe(() => {
        this.recalcularFiltros();
      })
    );

    this.subs.add(
      this.form.get('proveedorId')!.valueChanges.subscribe(() => {
        this.recalcularFiltros();
      })
    );

    this.subs.add(
      this.form.get('obraId')!.valueChanges.subscribe(() => {
        this.recalcularFiltros();
        this.cargar$.next();
      })
    );
  }

  private recalcularFiltros(): void {
    const clienteId = this.form.get('clienteId')?.value;
    const proveedorId = this.form.get('proveedorId')?.value;
    const obraId = this.form.get('obraId')?.value;

    // Calcular listas disponibles basándose en filtros actuales
    this.clientesFiltrados = this.getClientesDisponibles(clienteId, proveedorId, obraId);
    this.obrasFiltradas = this.getObrasDisponibles(clienteId, proveedorId, obraId);
    this.proveedoresFiltrados = this.getProveedoresDisponibles(clienteId, proveedorId, obraId);

    this.cargar$.next();
  }

  private getObrasDisponibles(clienteId: number | null, proveedorId: number | null, obraId: number | null): Array<{ id: number; nombre: string }> {
    let obrasDisponibles = new Set<number>();

    if (obraId) {
      // Si obra está seleccionada, solo esa obra
      obrasDisponibles.add(obraId);
    } else if (clienteId && proveedorId) {
      // Intersección: obras del cliente que también tienen ese proveedor
      const obrasDelCliente = this.clienteObras[String(clienteId)] || [];
      const obrasDelProveedor = this.proveedorObras[String(proveedorId)] || [];
      obrasDelCliente.forEach((o) => {
        if (obrasDelProveedor.includes(o)) {
          obrasDisponibles.add(o);
        }
      });
    } else if (clienteId) {
      // Solo obras del cliente
      (this.clienteObras[String(clienteId)] || []).forEach((o) => obrasDisponibles.add(o));
    } else if (proveedorId) {
      // Solo obras del proveedor
      (this.proveedorObras[String(proveedorId)] || []).forEach((o) => obrasDisponibles.add(o));
    } else {
      // Todas las obras
      this.obrasTodas.forEach((o) => obrasDisponibles.add(o.id));
    }

    return this.obrasTodas.filter((o) => obrasDisponibles.has(o.id));
  }

  private getClientesDisponibles(clienteId: number | null, proveedorId: number | null, obraId: number | null): Array<{ id: number; nombre: string }> {
    let clientesDisponibles = new Set<number>();

    if (clienteId) {
      // Si cliente está seleccionado, solo ese cliente
      clientesDisponibles.add(clienteId);
    } else if (obraId && proveedorId) {
      // Intersección: cliente de la obra que también tenga ese proveedor
      const clienteDeObra = this.obraCliente[String(obraId)];
      if (clienteDeObra) {
        const proveedoresDelCliente = this.clienteProveedores[String(clienteDeObra)] || [];
        if (proveedoresDelCliente.includes(proveedorId)) {
          clientesDisponibles.add(clienteDeObra);
        }
      }
    } else if (obraId) {
      // Solo cliente de esa obra
      const clienteDeObra = this.obraCliente[String(obraId)];
      if (clienteDeObra) {
        clientesDisponibles.add(clienteDeObra);
      }
    } else if (proveedorId) {
      // Clientes cuyas obras tienen ese proveedor
      const obrasDelProveedor = this.proveedorObras[String(proveedorId)] || [];
      obrasDelProveedor.forEach((obraId) => {
        const clienteDeObra = this.obraCliente[String(obraId)];
        if (clienteDeObra) {
          clientesDisponibles.add(clienteDeObra);
        }
      });
    } else {
      // Todos los clientes
      this.clientesTodos.forEach((c) => clientesDisponibles.add(c.id));
    }

    return this.clientesTodos.filter((c) => clientesDisponibles.has(c.id));
  }

  private getProveedoresDisponibles(clienteId: number | null, proveedorId: number | null, obraId: number | null): Array<{ id: number; nombre: string }> {
    let proveedoresDisponibles = new Set<number>();

    if (proveedorId) {
      // Si proveedor está seleccionado, solo ese proveedor
      proveedoresDisponibles.add(proveedorId);
    } else if (clienteId && obraId) {
      // Intersección: proveedor de la obra que pertenece al cliente
      const obrasDelCliente = this.clienteObras[String(clienteId)] || [];
      if (obrasDelCliente.includes(obraId)) {
        const proveedoresEnObra = this.obraProveedores[String(obraId)] || [];
        proveedoresEnObra.forEach((p) => proveedoresDisponibles.add(p));
      }
    } else if (clienteId) {
      // Proveedores que trabajan en obras del cliente
      (this.clienteProveedores[String(clienteId)] || []).forEach((p) => proveedoresDisponibles.add(p));
    } else if (obraId) {
      // Solo proveedores de esa obra
      (this.obraProveedores[String(obraId)] || []).forEach((p) => proveedoresDisponibles.add(p));
    } else {
      // Todos los proveedores
      this.proveedoresTodos.forEach((p) => proveedoresDisponibles.add(p.id));
    }

    return this.proveedoresTodos.filter((p) => proveedoresDisponibles.has(p.id));
  }


  private buildFiltro(): ReportFilter {
    return {
      grupoId: this.form.get('grupoId')?.value,
      obraId: this.form.get('obraId')?.value,
      clienteId: this.form.get('clienteId')?.value,
      proveedorId: this.form.get('proveedorId')?.value
    };
  }

  limpiarFiltros(): void {
    this.form.reset(null, { emitEvent: false });
    this.clientesFiltrados = [...this.clientesTodos];
    this.proveedoresFiltrados = [...this.proveedoresTodos];
    this.obrasFiltradas = [...this.obrasTodas];
    this.cargar$.next();
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
}
