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

  // Listas de filtrado en cascada
  private obrasTodas: Array<{ id: number; nombre: string }> = [];
  private proveedoresTodos: Array<{ id: number; nombre: string }> = [];
  private clienteObrasMapa: Record<number, number[]> = {};
  private obraProveedoresMapa: Record<number, number[]> = {};

  obrasFiltradas: Array<{ id: number; nombre: string }> = [];
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
          this.clientes = response.clientes || [];
          this.obrasTodas = response.obras || [];
          this.proveedoresTodos = response.proveedores || [];
          this.clienteObrasMapa = response.relaciones?.clienteObras || {};
          this.obraProveedoresMapa = response.relaciones?.obraProveedores || {};

          // Inicializar listas filtradas con todas las opciones
          this.obrasFiltradas = [...this.obrasTodas];
          this.proveedoresFiltrados = [...this.proveedoresTodos];

          this.setupListenersClienteProveedor();
          this.cargar$.next();
        },
        error: (err) => {
          console.error('Error al cargar catálogos', err);
          this.cargar$.next();
        }
      })
    );
  }

  private setupListenersClienteProveedor(): void {
    // Escuchar cambios en clienteId
    this.subs.add(
      this.form.get('clienteId')!.valueChanges.subscribe((clienteId) => {
        this.onClienteChange(clienteId);
      })
    );

    // Escuchar cambios en proveedorId
    this.subs.add(
      this.form.get('proveedorId')!.valueChanges.subscribe((proveedorId) => {
        this.onProveedorChange(proveedorId);
      })
    );

    // Escuchar cambios en obraId
    this.subs.add(
      this.form.get('obraId')!.valueChanges.subscribe(() => {
        this.cargar$.next();
      })
    );
  }

  private onClienteChange(clienteId: number | null): void {
    if (clienteId) {
      // Obtener obras del cliente
      const obrasDeCliente = this.clienteObrasMapa[clienteId] || [];
      this.obrasFiltradas = this.obrasTodas.filter((o) => obrasDeCliente.includes(o.id));

      // Filtrar proveedores que trabajan en las obras del cliente
      const proveedoresDisponibles = new Set<number>();
      obrasDeCliente.forEach((obraId) => {
        const proveedoresEnObra = this.obraProveedoresMapa[obraId] || [];
        proveedoresEnObra.forEach((p) => proveedoresDisponibles.add(p));
      });
      this.proveedoresFiltrados = this.proveedoresTodos.filter((p) => proveedoresDisponibles.has(p.id));
    } else {
      // Sin cliente, mostrar todas las opciones
      this.proveedoresFiltrados = [...this.proveedoresTodos];
      this.obrasFiltradas = [...this.obrasTodas];
    }

    // Resetear proveedorId y obraId sin disparar eventos
    this.form.patchValue({ proveedorId: null, obraId: null }, { emitEvent: false });
    this.cargar$.next();
  }

  private onProveedorChange(proveedorId: number | null): void {
    const clienteId = this.form.get('clienteId')?.value;

    if (proveedorId) {
      // Obtener obras del proveedor
      const obrasDelProveedor = Object.entries(this.obraProveedoresMapa)
        .filter(([_, provIds]) => (provIds as number[]).includes(proveedorId))
        .map(([obraId]) => Number(obraId));

      if (clienteId) {
        // Intersección: obras del cliente AND obras del proveedor
        const obrasDeCliente = this.clienteObrasMapa[clienteId] || [];
        this.obrasFiltradas = this.obrasTodas.filter(
          (o) => obrasDeCliente.includes(o.id) && obrasDelProveedor.includes(o.id)
        );
      } else {
        // Solo obras del proveedor
        this.obrasFiltradas = this.obrasTodas.filter((o) => obrasDelProveedor.includes(o.id));
      }
    } else {
      // Sin proveedor
      if (clienteId) {
        const obrasDeCliente = this.clienteObrasMapa[clienteId] || [];
        this.obrasFiltradas = this.obrasTodas.filter((o) => obrasDeCliente.includes(o.id));
      } else {
        this.obrasFiltradas = [...this.obrasTodas];
      }
    }

    // Resetear obraId sin disparar evento
    this.form.patchValue({ obraId: null }, { emitEvent: false });
    this.cargar$.next();
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
