import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import {FlujoCajaResponse, MovimientoDashboard, ResumenGeneralResponse, Tarea, Obra, Cliente, Proveedor, Transaccion, ObraCosto} from '../../../core/models/models';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {FormsModule} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';
import {RadioButtonModule} from 'primeng/radiobutton';
import {FileUploadModule} from 'primeng/fileupload';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ProveedoresService, CatalogoOption} from '../../../services/proveedores/proveedores.service';
import {FacturasService} from '../../../services/facturas/facturas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Toast,
    ProgressSpinnerModule,
    Button,
    EstadoFormatPipe,
    FormsModule,
    AutoComplete,
    Select,
    InputText,
    InputNumber,
    DatePicker,
    RadioButtonModule,
    FileUploadModule,
    ModalComponent
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Estados de carga
  loadingGeneral = true;

  // Datos principales
  resumenGeneral!: ResumenGeneralResponse;
  flujoCaja!: FlujoCajaResponse;
  tareasRecientes: Tarea[] = [];
  movimientosRecientes: MovimientoDashboard[] = [];
  obras: Obra[] = [];
  filteredObras: Obra[] = [];
  proveedores: Proveedor[] = [];
  clientes: Cliente[] = [];
  ivaOptions: { label: string; name: string }[] = [];
  tiposProveedor: CatalogoOption[] = [];
  gremiosProveedor: CatalogoOption[] = [];
  conteoObras = {
    total: 0,
    cotizadas: 0,
    perdidas: 0,
    adjudicadas: 0,
    activas: 0,
    finalizadas: 0,
  };

  showMovimientoModal = false;
  showClienteModal = false;
  showProveedorModal = false;
  showTareaModal = false;
  showFacturaModal = false;

  movimientoObra: Obra | null = null;
  movimientoObraDetalle: Obra | null = null;
  movimientoTipoEntidad: 'CLIENTE' | 'PROVEEDOR' = 'CLIENTE';
  movimientoClientesObra: Cliente[] = [];
  movimientoProveedoresObra: Proveedor[] = [];
  movimientoCostosObra: ObraCosto[] = [];
  filteredMovimientoClientes: Cliente[] = [];
  filteredMovimientoProveedores: Proveedor[] = [];
  movimientoCosto: ObraCosto | null = null;
  movimientoCliente: Cliente | null = null;
  movimientoProveedor: Proveedor | null = null;
  movimientoForm: Partial<Transaccion> = {
    tipo_transaccion: 'COBRO',
    forma_pago: 'TOTAL',
    medio_pago: 'Transferencia',
    fecha: new Date(),
    monto: 0
  };

  tareaObra: Obra | null = null;
  tareaObraDetalle: Obra | null = null;
  tareaProveedoresObra: Proveedor[] = [];
  tareaProveedor: Proveedor | null = null;
  tareaForm: Partial<Tarea> = {
    nombre: '',
    descripcion: '',
    estado_tarea: 'PENDIENTE',
    porcentaje: 0,
    fecha_inicio: new Date().toISOString()
  };

  clienteForm: Partial<Cliente> = {
    nombre: '',
    contacto: '',
    direccion: '',
    cuit: '',
    condicion_iva: undefined,
    telefono: '',
    email: '',
    activo: true
  };

  proveedorForm: Partial<Proveedor> = {
    nombre: '',
    tipo_proveedor: '',
    gremio: '',
    direccion: '',
    contacto: '',
    cuit: '',
    telefono: '',
    email: '',
    activo: true
  };

  facturaForm: {
    id_cliente: number | null;
    id_obra: number | null;
    fecha: Date;
    monto: number | null;
  } = {
    id_cliente: null,
    id_obra: null,
    fecha: new Date(),
    monto: null
  };
  facturaObrasFiltradas: Obra[] = [];
  facturaFile: File | null = null;

  constructor(
    private router: Router,
    private reportesService: ReportesService,
    private tareasService: TareasService,
    private transaccionesService: TransaccionesService,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private facturasService: FacturasService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  private cargarDashboard(): void {
    this.loadingGeneral = true;

    // Cargar datos principales en paralelo
    forkJoin({
      resumen: this.reportesService.getResumenGeneral(),
      flujo: this.reportesService.getFlujoCaja(),
      obras: this.obrasService.getObras(),
      proveedores: this.proveedoresService.getProveedores(),
      clientes: this.clientesService.getClientes()
    }).subscribe({
      next: ({ resumen, flujo, obras, proveedores, clientes }) => {
        this.resumenGeneral = resumen;
        this.flujoCaja = flujo;
        this.conteoObras = this.calcularConteosObras(obras);
        this.obras = obras || [];
        this.proveedores = proveedores || [];
        this.clientes = clientes || [];
        this.facturaObrasFiltradas = [...this.obras];

        // Cargar tareas de las últimas 3 obras
        const obrasRecientes = obras.slice(0, 3);
        const tareasPromises = obrasRecientes.map(obra =>
          this.tareasService.getTareasByObra(obra.id!)
        );

        if (tareasPromises.length > 0) {
          forkJoin(tareasPromises).subscribe({
            next: (tareasPorObra) => {
              // Aplanar y ordenar por más recientes
              const mapaObras = new Map(obrasRecientes.map(o => [o.id, o.nombre]));
              this.tareasRecientes = ([] as (Tarea & { obraNombre?: string })[])
                .concat(...tareasPorObra)
                .map(t => ({
                  ...t,
                  obraNombre: mapaObras.get(t.id_obra) || 'Obra sin nombre'
                }))
                .sort((a, b) => (b.id || 0) - (a.id || 0));
            }
          });
        }

        // Cargar movimientos recientes (últimos movimientos del flujo de caja)
        this.movimientosRecientes = (flujo.movimientos || [])
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 10);

        this.loadingGeneral = false;
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        this.loadingGeneral = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del dashboard'
        });
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  filtrarObras(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredObras = (this.obras || []).filter(o =>
      (o.nombre || '').toLowerCase().includes(query)
    );
  }

  abrirMovimientoModal() {
    this.resetMovimientoForm();
    this.showMovimientoModal = true;
  }

  cerrarMovimientoModal() {
    this.showMovimientoModal = false;
  }

  abrirClienteModal() {
    this.resetClienteForm();
    this.cargarCondicionesIva();
    this.showClienteModal = true;
  }

  cerrarClienteModal() {
    this.showClienteModal = false;
  }

  abrirProveedorModal() {
    this.resetProveedorForm();
    this.cargarCatalogosProveedor();
    this.showProveedorModal = true;
  }

  cerrarProveedorModal() {
    this.showProveedorModal = false;
  }

  abrirTareaModal() {
    this.resetTareaForm();
    this.showTareaModal = true;
  }

  cerrarTareaModal() {
    this.showTareaModal = false;
  }

  abrirFacturaModal() {
    this.resetFacturaForm();
    this.facturaObrasFiltradas = [...this.obras];
    this.showFacturaModal = true;
  }

  cerrarFacturaModal() {
    this.showFacturaModal = false;
  }

  onFacturaClienteChange() {
    if (!this.facturaForm.id_cliente) {
      this.facturaObrasFiltradas = [...this.obras];
      this.facturaForm.id_obra = null;
      return;
    }
    this.facturaObrasFiltradas = this.obras.filter(o =>
      Number(o.cliente?.id) === Number(this.facturaForm.id_cliente)
    );
    this.facturaForm.id_obra = null;
  }

  onFacturaFileSelected(event: any) {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.facturaFile = files?.[0] ?? null;
  }

  quitarFacturaArchivo() {
    this.facturaFile = null;
  }

  onMovimientoObraSelect(obra: Obra | null) {
    this.movimientoObra = obra;
    this.movimientoObraDetalle = null;
    this.movimientoClientesObra = [];
    this.movimientoProveedoresObra = [];
    this.movimientoCostosObra = [];
    this.filteredMovimientoClientes = [];
    this.filteredMovimientoProveedores = [];
    this.movimientoCosto = null;
    this.movimientoCliente = null;
    this.movimientoProveedor = null;

    if (!obra?.id) return;
    this.obrasService.getObraById(obra.id).subscribe(detalle => {
      this.movimientoObraDetalle = detalle;
      this.movimientoClientesObra = detalle?.cliente ? [detalle.cliente] : [];
      this.movimientoProveedoresObra = this.proveedoresDeObra(detalle);
      this.movimientoCostosObra = detalle?.costos ?? [];
      this.filteredMovimientoClientes = [...this.movimientoClientesObra];
      this.filteredMovimientoProveedores = [...this.movimientoProveedoresObra];
      if (this.movimientoTipoEntidad === 'CLIENTE') {
        this.movimientoCliente = this.movimientoClientesObra[0] || null;
      }
    });
  }

  onMovimientoTipoEntidadChange() {
    this.movimientoCliente = null;
    this.movimientoProveedor = null;
    this.movimientoCosto = null;
    const requerido = this.movimientoTipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
    this.movimientoForm.tipo_transaccion = requerido;
    if (this.movimientoTipoEntidad === 'CLIENTE') {
      this.movimientoCliente = this.movimientoClientesObra[0] || null;
      this.filteredMovimientoClientes = [...this.movimientoClientesObra];
    } else {
      this.filteredMovimientoProveedores = [...this.movimientoProveedoresObra];
    }
  }

  onMovimientoProveedorChange() {
    this.movimientoCosto = null;
  }

  onMovimientoProveedorSelect(proveedor: Proveedor | null) {
    this.movimientoProveedor = proveedor;
    this.onMovimientoProveedorChange();
  }

  onMovimientoClienteSelect(cliente: Cliente | null) {
    this.movimientoCliente = cliente;
  }

  onMovimientoCostoSelect(costo: ObraCosto | null) {
    this.movimientoCosto = costo;
    if (costo) {
      this.aplicarFormaPagoDesdeCosto(costo);
    }
  }

  getCostosMovimientoProveedor(): ObraCosto[] {
    if (!this.movimientoProveedor?.id) return [];
    const proveedorId = Number(this.movimientoProveedor.id);
    return (this.movimientoCostosObra || []).filter(c =>
      Number((c as any).id_proveedor ?? (c as any).proveedor?.id) === proveedorId &&
      (c.estado_pago || '').toString().toUpperCase() !== 'PAGADO'
    );
  }

  filtrarMovimientoClientes(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredMovimientoClientes = (this.movimientoClientesObra || []).filter(c =>
      (c.nombre || '').toLowerCase().includes(query)
    );
  }

  filtrarMovimientoProveedores(event: any) {
    if (!this.movimientoObra?.id) {
      this.filteredMovimientoProveedores = [];
      return;
    }
    const query = (event?.query || '').toLowerCase();
    this.filteredMovimientoProveedores = (this.movimientoProveedoresObra || []).filter(p =>
      (p.nombre || '').toLowerCase().includes(query)
    );
  }

  guardarMovimientoRapido() {
    if (!this.movimientoObra?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta obra',
        detail: 'Selecciona una obra.'
      });
      return;
    }

    const asociado = this.movimientoTipoEntidad === 'PROVEEDOR' ? this.movimientoProveedor : this.movimientoCliente;
    if (!asociado?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta asociado',
        detail: 'Selecciona el asociado de la obra.'
      });
      return;
    }

    if (!this.validarMontoMovimientoRapido()) {
      return;
    }

    const payload: any = {
      id_obra: this.movimientoObra.id,
      id_asociado: asociado.id,
      id_costo: this.movimientoCosto?.id ?? undefined,
      tipo_asociado: this.movimientoTipoEntidad,
      tipo_transaccion: this.movimientoForm.tipo_transaccion,
      fecha: this.movimientoForm.fecha instanceof Date
        ? this.movimientoForm.fecha.toISOString().split('T')[0]
        : this.movimientoForm.fecha,
      monto: this.movimientoForm.monto ?? 0,
      forma_pago: this.movimientoForm.forma_pago ?? 'TOTAL',
      medio_pago: this.movimientoForm.medio_pago ?? 'Transferencia'
    };

    this.transaccionesService.create(payload).subscribe({
      next: () => {
        this.showMovimientoModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Movimiento creado',
          detail: 'Se creo el movimiento correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el movimiento.'
        });
      }
    });
  }

  onTareaObraSelect(obra: Obra | null) {
    this.tareaObra = obra;
    this.tareaObraDetalle = null;
    this.tareaProveedor = null;
    this.tareaProveedoresObra = [];

    if (!obra?.id) return;
    this.obrasService.getObraById(obra.id).subscribe(detalle => {
      this.tareaObraDetalle = detalle;
      this.tareaProveedoresObra = this.proveedoresDeObra(detalle);
    });
  }

  guardarTareaRapida() {
    if (!this.tareaObra?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta obra',
        detail: 'Selecciona una obra.'
      });
      return;
    }
    if (!this.tareaProveedor?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta proveedor',
        detail: 'Selecciona un proveedor de la obra.'
      });
      return;
    }
    if (!this.tareaForm.nombre) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta nombre',
        detail: 'Completa el nombre de la tarea.'
      });
      return;
    }

    const payload = {
      id_obra: this.tareaObra.id,
      id_proveedor: this.tareaProveedor.id,
      estado_tarea: 'PENDIENTE',
      nombre: this.tareaForm.nombre,
      descripcion: this.tareaForm.descripcion ?? '',
      porcentaje: this.tareaForm.porcentaje ?? 0,
      fecha_inicio: this.normalizarFechaInicio(this.tareaForm.fecha_inicio)
    };

    this.tareasService.createTarea(payload as any).subscribe({
      next: () => {
        this.showTareaModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Tarea creada',
          detail: 'Se creo la tarea correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la tarea.'
        });
      }
    });
  }

  guardarClienteRapido() {
    if (!this.clienteForm.nombre || !this.clienteForm.contacto || !this.clienteForm.cuit ||
      !this.clienteForm.condicion_iva || !this.clienteForm.telefono || !this.clienteForm.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa los datos obligatorios del cliente.'
      });
      return;
    }

    this.clientesService.createCliente(this.clienteForm as Cliente).subscribe({
      next: () => {
        this.showClienteModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente creado',
          detail: 'Se creo el cliente correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el cliente.'
        });
      }
    });
  }

  guardarProveedorRapido() {
    if (!this.proveedorForm.nombre || !this.proveedorForm.tipo_proveedor || !this.proveedorForm.contacto ||
      !this.proveedorForm.cuit || !this.proveedorForm.telefono || !this.proveedorForm.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa los datos obligatorios del proveedor.'
      });
      return;
    }

    this.proveedoresService.createProveedor(this.proveedorForm).subscribe({
      next: () => {
        this.showProveedorModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'Se creo el proveedor correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el proveedor.'
        });
      }
    });
  }

  guardarFacturaRapida() {
    if (!this.facturaForm.id_cliente || !this.facturaForm.id_obra) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona cliente y obra.'
      });
      return;
    }
    const monto = Number(this.facturaForm.monto ?? 0);
    if (!monto || monto <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Ingresa un monto mayor a 0.'
      });
      return;
    }

    const payload = {
      id_cliente: Number(this.facturaForm.id_cliente),
      id_obra: Number(this.facturaForm.id_obra),
      monto,
      fecha: this.formatDate(this.facturaForm.fecha)
    };

    this.facturasService.createFactura(payload, this.facturaFile).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Factura creada',
          detail: 'La factura se guardo correctamente.'
        });
        this.cerrarFacturaModal();
        this.resetFacturaForm();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la factura.'
        });
      }
    });
  }

  navigateToObrasEstado(estado?: string): void {
    if (estado) {
      this.router.navigate(['/obras'], { queryParams: { estado } });
    } else {
      this.router.navigate(['/obras']);
    }
  }

  get totalPresupuestoObras(): number {
    return (this.obras || []).reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);
  }

  get totalCobrosDashboard(): number {
    return Number(this.flujoCaja?.totalIngresos ?? 0);
  }

  get totalPagosDashboard(): number {
    return Number(this.flujoCaja?.totalEgresos ?? 0);
  }

  get saldoPorCobrarDashboard(): number {
    return Math.max(0, this.totalPresupuestoObras - this.totalCobrosDashboard);
  }

  private calcularConteosObras(obras: { obra_estado: string }[]): typeof this.conteoObras {
    const normalizar = (estado: string | undefined | null) => (estado || '').toUpperCase();
    return obras.reduce((acc, obra) => {
      const estado = normalizar((obra as any).obra_estado);
      acc.total += 1;
      if (estado.includes('COTIZ')) acc.cotizadas += 1;
      if (estado.includes('PERDID')) acc.perdidas += 1;
      if (estado.includes('ADJUDIC')) acc.adjudicadas += 1;
      if (estado.includes('ACTIV')) acc.activas += 1;
      if (estado.includes('FINALIZ')) acc.finalizadas += 1;
      return acc;
    }, { ...this.conteoObras });
  }

  private proveedoresDeObra(obra: Obra): Proveedor[] {
    const ids = new Set<number>();
    const proveedoresDirectos = (obra as any)?.proveedores as Proveedor[] | undefined;
    (proveedoresDirectos || []).forEach(p => {
      const id = Number((p as any)?.id ?? (p as any)?.id_proveedor ?? 0);
      if (id) ids.add(id);
    });
    (obra?.costos || []).forEach(c => {
      const id = Number((c.proveedor as any)?.id ?? c.id_proveedor ?? 0);
      if (id) ids.add(id);
    });
    (obra?.tareas || []).forEach(t => {
      const id = Number((t.proveedor as any)?.id ?? t.id_proveedor ?? 0);
      if (id) ids.add(id);
    });
    return this.proveedores.filter(p => ids.has(Number(p.id)));
  }

  private aplicarFormaPagoDesdeCosto(costo: ObraCosto) {
    const estado = (costo.estado_pago || '').toString().toUpperCase();
    if (estado === 'PARCIAL') {
      this.movimientoForm.forma_pago = 'PARCIAL';
      return;
    }
    if (estado === 'PAGADO') {
      this.movimientoForm.forma_pago = 'TOTAL';
    }
  }

  private cargarCondicionesIva() {
    if (this.ivaOptions.length > 0) return;
    this.clientesService.getCondicionesIva().subscribe({
      next: (options) => this.ivaOptions = options,
      error: () => this.ivaOptions = []
    });
  }

  private cargarCatalogosProveedor() {
    if (this.tiposProveedor.length === 0) {
      this.proveedoresService.getTipos().subscribe({
        next: (tipos) => this.tiposProveedor = tipos,
        error: () => this.tiposProveedor = []
      });
    }
    if (this.gremiosProveedor.length === 0) {
      this.proveedoresService.getGremios().subscribe({
        next: (gremios) => this.gremiosProveedor = gremios,
        error: () => this.gremiosProveedor = []
      });
    }
  }

  private resetMovimientoForm() {
    this.movimientoObra = null;
    this.movimientoObraDetalle = null;
    this.movimientoClientesObra = [];
    this.movimientoProveedoresObra = [];
    this.movimientoCostosObra = [];
    this.filteredMovimientoClientes = [];
    this.filteredMovimientoProveedores = [];
    this.movimientoCosto = null;
    this.movimientoCliente = null;
    this.movimientoProveedor = null;
    this.movimientoTipoEntidad = 'CLIENTE';
    this.movimientoForm = {
      tipo_transaccion: 'COBRO',
      forma_pago: 'TOTAL',
      medio_pago: 'Transferencia',
      fecha: new Date(),
      monto: 0
    };
  }

  private resetTareaForm() {
    this.tareaObra = null;
    this.tareaObraDetalle = null;
    this.tareaProveedor = null;
    this.tareaProveedoresObra = [];
    this.tareaForm = {
      nombre: '',
      descripcion: '',
      estado_tarea: 'PENDIENTE',
      porcentaje: 0,
      fecha_inicio: new Date().toISOString()
    };
  }

  private resetClienteForm() {
    this.clienteForm = {
      nombre: '',
      contacto: '',
      direccion: '',
      cuit: '',
      condicion_iva: undefined,
      telefono: '',
      email: '',
      activo: true
    };
  }

  private resetProveedorForm() {
    this.proveedorForm = {
      nombre: '',
      tipo_proveedor: '',
      gremio: '',
      direccion: '',
      contacto: '',
      cuit: '',
      telefono: '',
      email: '',
      activo: true
    };
  }

  private resetFacturaForm() {
    this.facturaForm = {
      id_cliente: null,
      id_obra: null,
      fecha: new Date(),
      monto: null
    };
    this.facturaFile = null;
  }

  private normalizarFechaInicio(valor?: string) {
    if (!valor) return new Date().toISOString();
    if (valor.length === 10) {
      return `${valor}T00:00:00`;
    }
    return valor;
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }

  private validarMontoMovimientoRapido(): boolean {
    if (!this.movimientoCosto?.id) return true;
    if (this.movimientoTipoEntidad !== 'PROVEEDOR') return true;

    const formaPago = (this.movimientoForm.forma_pago || '').toString().toUpperCase();
    const monto = Number(this.movimientoForm.monto ?? 0);
    const totalCosto = Number(this.movimientoCosto.total ?? 0);
    const diferencia = Math.abs(monto - totalCosto);

    if (formaPago === 'TOTAL' && diferencia >= 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para pago total, el monto debe ser igual al total del costo.'
      });
      return false;
    }

    if (formaPago === 'PARCIAL' && monto >= totalCosto) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para pago parcial, el monto debe ser menor al total del costo.'
      });
      return false;
    }

    return true;
  }
}
