import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { Toast } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import {FlujoCajaResponse, MovimientoDashboard, ResumenGeneralResponse, Tarea, Obra, Cliente, Proveedor, Transaccion, ObraCosto, ReportFilter} from '../../../core/models/models';
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
import {EditorModule} from 'primeng/editor';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {ProveedorQuickModalComponent} from '../../components/proveedor-quick-modal/proveedor-quick-modal.component';
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
    EditorModule,
    ModalComponent,
    ProveedorQuickModalComponent
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
  obrasComparativo: Array<{ id: number; nombre: string; presupuesto: number; porcentaje: number }> = [];
  flujoDineroSerie: Array<{ fecha: string; ingresos: number; egresos: number; saldo: number }> = [];
  flujoDineroMax = 0;
  obras: Obra[] = [];
  filteredObras: Obra[] = [];
  proveedores: Proveedor[] = [];
  clientes: Cliente[] = [];
  filtrosDashboard = {
    obra: null as Obra | null,
    cliente: null as Cliente | null,
    proveedor: null as Proveedor | null,
    rangoFechas: null as Date[] | null
  };
  filteredClientes: Cliente[] = [];
  filteredProveedores: Proveedor[] = [];
  ivaOptions: { label: string; name: string }[] = [];
  tiposProveedor: CatalogoOption[] = [];
  gremiosProveedor: CatalogoOption[] = [];
  private readonly NUEVO_TIPO_VALUE = '__nuevo_tipo__';
  private readonly NUEVO_GREMIO_VALUE = '__nuevo_gremio__';
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
  showGremioModal = false;
  showTareaModal = false;
  showFacturaModal = false;

  movimientoObra: Obra | null = null;
  movimientoObraDetalle: Obra | null = null;
  movimientoTipoEntidad: 'CLIENTE' | 'PROVEEDOR' = 'CLIENTE';
  movimientoClientesObra: Cliente[] = [];
  movimientoProveedoresObra: Proveedor[] = [];
  movimientoTransaccionesObra: Transaccion[] = [];
  filteredMovimientoClientes: Cliente[] = [];
  filteredMovimientoProveedores: Proveedor[] = [];
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
    numero_orden: undefined,
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
    descripcion: string;
    estado: string;
  } = {
    id_cliente: null,
    id_obra: null,
    fecha: new Date(),
    monto: null,
    descripcion: '',
    estado: 'EMITIDA'
  };
  facturaObrasFiltradas: Obra[] = [];
  facturaFile: File | null = null;
  facturaRestanteObra: number | null = null;
  showTipoProveedorModal = false;
  nuevoTipoProveedorNombre = '';
  nuevoGremioNombre = '';
  guardandoTipoProveedor = false;
  guardandoGremio = false;

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

  private cargarDashboard(filtro?: ReportFilter): void {
    this.loadingGeneral = true;

    // Cargar datos principales en paralelo
    forkJoin({
      resumen: this.reportesService.getResumenGeneral(),
      flujo: this.reportesService.getFlujoCaja(filtro),
      obras: this.obrasService.getObras(),
      proveedores: this.proveedoresService.getProveedoresAll(),
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
        this.filteredObras = [...this.obras];
        this.filteredClientes = [...this.clientes];
        this.filteredProveedores = [...this.proveedores];
        this.obrasComparativo = this.construirComparativoObras(this.obras, filtro);

        // Cargar tareas de las ultimas 3 obras segun filtros
        const obrasRecientes = this.obtenerObrasFiltradasDashboard().slice(0, 3);
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

        // Cargar movimientos recientes
        this.movimientosRecientes = (flujo.movimientos || [])
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 10);
        this.flujoDineroSerie = this.construirSerieFlujo(flujo.movimientos || []);

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

  filtrarClientes(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredClientes = (this.clientes || []).filter(c =>
      (c.nombre || '').toLowerCase().includes(query)
    );
  }

  filtrarProveedores(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredProveedores = (this.proveedores || []).filter(p =>
      (p.nombre || '').toLowerCase().includes(query)
    );
  }

  aplicarFiltrosDashboard() {
    const filtro = this.construirFiltroDashboard();
    this.cargarDashboard(filtro);
    this.obrasComparativo = this.construirComparativoObras(this.obras, filtro);
  }

  limpiarFiltrosDashboard() {
    this.filtrosDashboard = {
      obra: null,
      cliente: null,
      proveedor: null,
      rangoFechas: null
    };
    this.filteredObras = [...this.obras];
    this.filteredClientes = [...this.clientes];
    this.filteredProveedores = [...this.proveedores];
    this.obrasComparativo = this.construirComparativoObras(this.obras);
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
      this.facturaRestanteObra = null;
      return;
    }
    this.facturaObrasFiltradas = this.obras.filter(o =>
      Number(o.cliente?.id) === Number(this.facturaForm.id_cliente)
    );
    this.facturaForm.id_obra = null;
    this.facturaRestanteObra = null;
  }

  onFacturaObraChange() {
    const obraId = this.facturaForm.id_obra;
    if (!obraId) {
      this.facturaRestanteObra = null;
      return;
    }
    this.actualizarRestanteFacturaObra(Number(obraId));
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
    this.movimientoTransaccionesObra = [];
    this.movimientoTransaccionesObra = [];
    this.filteredMovimientoClientes = [];
    this.filteredMovimientoProveedores = [];
    this.movimientoCliente = null;
    this.movimientoProveedor = null;

    if (!obra?.id) return;
    this.obrasService.getObraById(obra.id).subscribe(detalle => {
      this.movimientoObraDetalle = detalle;
      this.movimientoClientesObra = detalle?.cliente ? [detalle.cliente] : [];
      this.movimientoProveedoresObra = this.proveedoresDeObra(detalle);
      this.filteredMovimientoClientes = [...this.movimientoClientesObra];
      this.filteredMovimientoProveedores = [...this.movimientoProveedoresObra];
      if (this.movimientoTipoEntidad === 'CLIENTE') {
        this.movimientoCliente = this.movimientoClientesObra[0] || null;
      }
      this.transaccionesService.getByObra(obra.id!).subscribe({
        next: (transacciones) => {
          this.movimientoTransaccionesObra = transacciones || [];
        },
        error: () => {
          this.movimientoTransaccionesObra = [];
        }
      });
    });
  }

  onMovimientoTipoEntidadChange() {
    this.movimientoCliente = null;
    this.movimientoProveedor = null;
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
    return;
  }

  onMovimientoProveedorSelect(proveedor: Proveedor | null) {
    this.movimientoProveedor = proveedor;
    this.onMovimientoProveedorChange();
    this.aplicarMontoProveedorMovimiento();
  }

  onMovimientoClienteSelect(cliente: Cliente | null) {
    this.movimientoCliente = cliente;
    this.aplicarMontoClienteMovimiento();
  }


  get movimientoPagadoCliente(): number | null {
    if (!this.movimientoCliente?.id) return null;
    return this.movimientoTransaccionesObra
      .filter(t => (t.tipo_asociado || '').toString().toUpperCase() === 'CLIENTE')
      .filter(t => Number(t.id_asociado) === Number(this.movimientoCliente?.id))
      .filter(t => (t.tipo_transaccion || '').toString().toUpperCase() === 'COBRO')
      .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
  }

  get movimientoTotalCliente(): number | null {
    if (!this.movimientoCliente?.id) return null;
    const presupuesto = Number(this.movimientoObraDetalle?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) return null;
    return presupuesto;
  }

  get movimientoRestanteCliente(): number | null {
    if (!this.movimientoCliente?.id) return null;
    const presupuesto = Number(this.movimientoObraDetalle?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) return null;
    const cobrado = this.movimientoPagadoCliente ?? 0;
    return Math.max(0, presupuesto - cobrado);
  }

  get movimientoTotalProveedor(): number | null {
    if (!this.movimientoProveedor?.id) return null;
    const costos = this.movimientoObraDetalle?.costos || [];
    return costos.reduce((acc, costo) => {
      const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
      if (id !== Number(this.movimientoProveedor?.id)) return acc;
      return acc + this.obtenerSubtotalCosto(costo);
    }, 0);
  }

  get movimientoPagadoProveedor(): number | null {
    if (!this.movimientoProveedor?.id) return null;
    return this.movimientoTransaccionesObra
      .filter(t => (t.tipo_asociado || '').toString().toUpperCase() === 'PROVEEDOR')
      .filter(t => Number(t.id_asociado) === Number(this.movimientoProveedor?.id))
      .filter(t => (t.tipo_transaccion || '').toString().toUpperCase() === 'PAGO')
      .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
  }

  get movimientoSaldoProveedor(): number | null {
    if (!this.movimientoProveedor?.id) return null;
    const total = this.movimientoTotalProveedor ?? 0;
    const pagado = this.movimientoPagadoProveedor ?? 0;
    return Math.max(0, total - pagado);
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
      numero_orden: this.tareaForm.numero_orden ?? undefined,
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
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.obtenerMensajeError(err, 'No se pudo crear la tarea.')
        });
      }
    });
  }

  guardarClienteRapido() {
    if (!this.clienteForm.nombre || !this.clienteForm.contacto || !this.clienteForm.cuit ||
      !this.clienteForm.condicion_iva || !this.clienteForm.telefono) {
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
      !this.proveedorForm.cuit || !this.proveedorForm.telefono) {
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
    if (!this.facturaForm.id_cliente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona el cliente.'
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
    if (this.facturaRestanteObra != null && monto > this.facturaRestanteObra + 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'El monto supera el restante disponible de la obra.'
      });
      return;
    }

    const payload = {
      id_cliente: Number(this.facturaForm.id_cliente),
      id_obra: this.facturaForm.id_obra != null ? Number(this.facturaForm.id_obra) : null,
      monto,
      fecha: this.formatDate(this.facturaForm.fecha),
      descripcion: this.facturaForm.descripcion || '',
      estado: this.facturaForm.estado || 'EMITIDA'
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

  get totalCobrosDashboard(): number {
    return this.calcularTotalMovimientos(['INGRESO', 'COBRO']);
  }

  get totalPagosDashboard(): number {
    return this.calcularTotalMovimientos(['EGRESO', 'PAGO']);
  }

  get totalPresupuestoObras(): number {
    const obras = this.filtrarObrasConDeuda(this.obras || []);
    return obras.reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);
  }

  get totalPresupuestoFiltradoDashboard(): number {
    const obrasFiltradas = this.filtrarObrasConDeuda(this.obtenerObrasFiltradasDashboard());
    return obrasFiltradas.reduce((acc, obra) => acc + Number(obra.presupuesto || 0), 0);
  }

  get totalCostosObras(): number {
    const obras = this.filtrarObrasConDeuda(this.obras || []);
    return obras.reduce((acc, obra) => {
      const costos = obra.costos || [];
      const totalObra = costos.reduce((sum, costo) => sum + this.obtenerSubtotalCosto(costo), 0);
      return acc + totalObra;
    }, 0);
  }

  get totalCostosFiltradosDashboard(): number {
    const obrasFiltradas = this.filtrarObrasConDeuda(this.obtenerObrasFiltradasDashboard());
    return (obrasFiltradas || []).reduce((acc, obra) => {
      const costos = obra.costos || [];
      const totalObra = costos.reduce((sum, costo) => sum + this.obtenerSubtotalCosto(costo), 0);
      return acc + totalObra;
    }, 0);
  }

  get porCobrarPendienteDashboard(): number {
    return Math.max(0, this.totalPresupuestoObras - this.totalCobrosDashboard);
  }

  get porPagarPendienteDashboard(): number {
    return Math.max(0, this.totalCostosObras - this.totalPagosDashboard);
  }

  get saldoPendienteDashboard(): number {
    return this.porCobrarPendienteDashboard - this.porPagarPendienteDashboard;
  }

  get saldoFlujoDashboard(): number {
    return this.totalCobrosDashboard - this.totalPagosDashboard;
  }

  get tareasRecientesFiltradas(): Tarea[] {
    let tareas = this.tareasRecientes || [];
    const obraId = this.filtrosDashboard?.obra?.id;
    const proveedorId = this.filtrosDashboard?.proveedor?.id;
    const rangoFechas = this.filtrosDashboard?.rangoFechas;

    if (obraId) {
      tareas = tareas.filter(t => Number(t.id_obra) === Number(obraId));
    }

    if (proveedorId) {
      tareas = tareas.filter(t => Number(t.proveedor?.id ?? t.id_proveedor) === Number(proveedorId));
    }

    if (rangoFechas?.[0] || rangoFechas?.[1]) {
      tareas = tareas.filter(t =>
        this.estaEnRangoFecha(t.fecha_inicio ?? t.creado_en, rangoFechas)
      );
    }

    return tareas;
  }

  get movimientosRecientesFiltradas(): MovimientoDashboard[] {
    return this.obtenerMovimientosFiltradosDashboard()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  get cuentaCorrienteModo(): 'CLIENTE' | 'PROVEEDOR' | 'GENERAL' {
    if (this.filtrosDashboard?.proveedor?.id) return 'PROVEEDOR';
    if (this.filtrosDashboard?.cliente?.id) return 'CLIENTE';
    return 'GENERAL';
  }

  get cuentaCorrientePresupuesto(): number {
    if (this.cuentaCorrienteModo === 'PROVEEDOR') {
      const proveedorId = this.filtrosDashboard?.proveedor?.id;
      if (!proveedorId) return this.totalCostosObras;
      return this.calcularTotalCostosProveedor(this.obtenerObrasFiltradasDashboard(), proveedorId);
    }
    return this.totalPresupuestoFiltradoDashboard;
  }

  get cuentaCorrienteSaldo(): number {
    if (this.cuentaCorrienteModo === 'PROVEEDOR') {
      return this.cuentaCorrientePresupuesto - this.totalPagosDashboard;
    }
    if (this.cuentaCorrienteModo === 'CLIENTE') {
      return this.cuentaCorrientePresupuesto - this.totalCobrosDashboard;
    }
    return this.saldoFlujoDashboard;
  }

  get dashboardCobrado(): number {
    const obraSeleccionada = this.obtenerObraSeleccionada();
    if (obraSeleccionada?.id) {
      return this.calcularTotalMovimientosDesdeLista(
        this.obtenerMovimientosPorObra(obraSeleccionada.id),
        ['INGRESO', 'COBRO']
      );
    }
    if (this.filtrosDashboard?.proveedor?.id) return 0;
    return this.totalCobrosDashboard;
  }

  get dashboardPorCobrar(): number {
    const obraSeleccionada = this.obtenerObraSeleccionada();
    if (obraSeleccionada?.id) {
      if (!this.obraGeneraDeuda(obraSeleccionada)) return 0;
      const cobrado = this.dashboardCobrado;
      const presupuesto = Number(obraSeleccionada.presupuesto ?? 0);
      return Math.max(0, presupuesto - cobrado);
    }
    if (this.filtrosDashboard?.proveedor?.id) return 0;
    const tieneRangoFechas = !!(this.filtrosDashboard?.rangoFechas?.[0] || this.filtrosDashboard?.rangoFechas?.[1]);
    const base = (this.filtrosDashboard?.cliente?.id || tieneRangoFechas)
      ? this.totalPresupuestoFiltradoDashboard
      : this.totalPresupuestoObras;
    return Math.max(0, base - this.totalCobrosDashboard);
  }

  get dashboardPagado(): number {
    const obraSeleccionada = this.obtenerObraSeleccionada();
    if (obraSeleccionada?.id) {
      return this.calcularTotalMovimientosDesdeLista(
        this.obtenerMovimientosPorObra(obraSeleccionada.id),
        ['EGRESO', 'PAGO']
      );
    }
    if (this.filtrosDashboard?.cliente?.id) return 0;
    return this.totalPagosDashboard;
  }

  get dashboardPorPagar(): number {
    const obraSeleccionada = this.obtenerObraSeleccionada();
    if (obraSeleccionada?.id) {
      if (!this.obraGeneraDeuda(obraSeleccionada)) return 0;
      const pagado = this.dashboardPagado;
      const totalCostos = this.totalCostosDeObra(obraSeleccionada);
      return Math.max(0, totalCostos - pagado);
    }
    if (this.filtrosDashboard?.cliente?.id) return 0;
    if (this.filtrosDashboard?.proveedor?.id) {
      const proveedorId = this.filtrosDashboard?.proveedor?.id ?? 0;
      const totalProveedor = this.calcularTotalCostosProveedor(this.filtrarObrasConDeuda(this.obtenerObrasFiltradasDashboard()), proveedorId);
      return Math.max(0, totalProveedor - this.totalPagosDashboard);
    }
    const tieneRangoFechas = !!(this.filtrosDashboard?.rangoFechas?.[0] || this.filtrosDashboard?.rangoFechas?.[1]);
    const base = tieneRangoFechas ? this.totalCostosFiltradosDashboard : this.totalCostosObras;
    return Math.max(0, base - this.totalPagosDashboard);
  }

  private obtenerMovimientosPorObra(obraId: number): MovimientoDashboard[] {
    let movimientos = this.flujoCaja?.movimientos || [];
    const rangoFechas = this.filtrosDashboard?.rangoFechas;
    movimientos = movimientos.filter(mov => Number(mov.obraId) === Number(obraId));
    if (rangoFechas?.[0] || rangoFechas?.[1]) {
      movimientos = movimientos.filter(mov =>
        this.estaEnRangoFecha(mov.fecha, rangoFechas)
      );
    }
    return movimientos;
  }

  private calcularTotalMovimientosDesdeLista(movimientos: MovimientoDashboard[], tipos: string[]): number {
    const tiposUpper = tipos.map(t => t.toUpperCase());
    return (movimientos || []).reduce((acc, mov) => {
      const tipo = (mov.tipo_movimiento || mov.tipo || '').toString().toUpperCase();
      if (!tiposUpper.includes(tipo)) return acc;
      return acc + Number(mov.monto ?? 0);
    }, 0);
  }

  private obtenerObraSeleccionada(): Obra | null {
    const obraId = this.filtrosDashboard?.obra?.id;
    if (!obraId) return null;
    const obra = (this.obras || []).find(o => Number(o.id) === Number(obraId)) ?? null;
    if (!obra) return null;
    const rangoFechas = this.filtrosDashboard?.rangoFechas;
    if (rangoFechas?.[0] || rangoFechas?.[1]) {
      const fechaBase = this.obtenerFechaCreacionObra(obra);
      if (!this.estaEnRangoFecha(fechaBase, rangoFechas)) return null;
    }
    return obra;
  }

  private totalCostosDeObra(obra: Obra): number {
    return (obra?.costos || []).reduce((sum, costo) => {
      return sum + this.obtenerSubtotalCosto(costo);
    }, 0);
  }

  private filtrarObrasConDeuda(obras: Obra[]): Obra[] {
    return (obras || []).filter(obra => this.obraGeneraDeuda(obra));
  }

  private obraGeneraDeuda(obra: Obra | null | undefined): boolean {
    if (!obra) return false;
    const estado = (obra.obra_estado || '').toString().toUpperCase();
    return (
      estado.includes('ADJUDIC') ||
      estado.includes('EN_PROGRESO') ||
      estado.includes('FINALIZ') ||
      estado.includes('FACTURAD')
    );
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

  private construirComparativoObras(obras: Obra[], filtro?: ReportFilter): Array<{ id: number; nombre: string; presupuesto: number; porcentaje: number }> {
    let filtradas = obras || [];

    if (filtro?.obraId) {
      filtradas = filtradas.filter(obra => Number(obra.id) === Number(filtro.obraId));
    }

    if (filtro?.clienteId) {
      filtradas = filtradas.filter(obra => Number(obra.cliente?.id) === Number(filtro.clienteId));
    }

    const ordenadas = filtradas
      .map((obra, index) => ({
        id: Number(obra.id ?? index),
        nombre: obra.nombre || 'Obra sin nombre',
        presupuesto: Number(obra.presupuesto ?? 0)
      }))
      .sort((a, b) => b.presupuesto - a.presupuesto)
      .slice(0, 5);

    const max = ordenadas.reduce((acc, obra) => Math.max(acc, obra.presupuesto), 0);

    return ordenadas.map(obra => ({
      ...obra,
      porcentaje: max > 0 ? Math.round((obra.presupuesto / max) * 100) : 0
    }));
  }

  private calcularTotalMovimientos(tipos: string[]): number {
    const buscados = new Set(tipos.map(t => t.toUpperCase()));
    return this.obtenerMovimientosFiltradosDashboard().reduce((acc, mov) => {
      const tipo = (mov.tipo_movimiento || mov.tipo || '').toString().toUpperCase();
      if (buscados.has(tipo)) {
        return acc + Number(mov.monto ?? 0);
      }
      return acc;
    }, 0);
  }

  private obtenerMovimientosFiltradosDashboard(): MovimientoDashboard[] {
    let movimientos = this.flujoCaja?.movimientos || [];
    const obraId = this.filtrosDashboard?.obra?.id;
    const clienteId = this.filtrosDashboard?.cliente?.id;
    const proveedorId = this.filtrosDashboard?.proveedor?.id;
    const rangoFechas = this.filtrosDashboard?.rangoFechas;

    if (obraId) {
      movimientos = movimientos.filter(mov => Number(mov.obraId) === Number(obraId));
    }

    if (clienteId) {
      movimientos = movimientos.filter(mov =>
        (mov.asociadoTipo || '').toString().toUpperCase() === 'CLIENTE' &&
        Number(mov.asociadoId) === Number(clienteId)
      );
    }

    if (proveedorId) {
      movimientos = movimientos.filter(mov =>
        (mov.asociadoTipo || '').toString().toUpperCase() === 'PROVEEDOR' &&
        Number(mov.asociadoId) === Number(proveedorId)
      );
    }

    if (rangoFechas?.[0] || rangoFechas?.[1]) {
      movimientos = movimientos.filter(mov =>
        this.estaEnRangoFecha(mov.fecha, rangoFechas)
      );
    }

    return movimientos;
  }

  private estaEnRangoFecha(
    fecha: string | Date | undefined | null,
    rangoFechas: Date[] | null
  ): boolean {
    if (!rangoFechas?.[0] && !rangoFechas?.[1]) return true;
    const inicio = rangoFechas?.[0] ? this.normalizarFechaLocal(rangoFechas[0]) : null;
    const fin = rangoFechas?.[1] ? this.normalizarFechaLocal(rangoFechas[1]) : null;
    const fechaMov = this.normalizarFechaLocal(fecha);
    if (!fechaMov) return false;
    if (inicio && fechaMov < inicio) return false;
    if (fin && fechaMov > fin) return false;
    return true;
  }

  private normalizarFechaLocal(valor: string | Date | undefined | null): Date | null {
    if (!valor) return null;
    if (valor instanceof Date) {
      return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    }

    const raw = valor.toString().split('T')[0];
    if (raw.includes('-')) {
      const [y, m, d] = raw.split('-').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    }
    if (raw.includes('/')) {
      const [d, m, y] = raw.split('/').map(Number);
      if (!y || !m || !d) return null;
      const year = y < 100 ? 2000 + y : y;
      return new Date(year, m - 1, d);
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private construirSerieFlujo(movimientos: MovimientoDashboard[]): Array<{ fecha: string; ingresos: number; egresos: number; saldo: number }> {
    const agrupados = new Map<string, { ingresos: number; egresos: number }>();
    (movimientos || []).forEach(mov => {
      const fecha = (mov.fecha || '').toString().split('T')[0] || 'Sin fecha';
      const actual = agrupados.get(fecha) ?? { ingresos: 0, egresos: 0 };
      const tipo = (mov.tipo_movimiento || mov.tipo || '').toString().toUpperCase();
      if (tipo === 'INGRESO' || tipo === 'COBRO') {
        actual.ingresos += Number(mov.monto ?? 0);
      } else if (tipo === 'EGRESO' || tipo === 'PAGO') {
        actual.egresos += Number(mov.monto ?? 0);
      }
      agrupados.set(fecha, actual);
    });

    const ordenadas = Array.from(agrupados.entries())
      .map(([fecha, data]) => ({ fecha, ingresos: data.ingresos, egresos: data.egresos }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    this.flujoDineroMax = ordenadas.reduce((acc, item) => Math.max(acc, item.ingresos, item.egresos), 0);

    let saldo = 0;
    return ordenadas.map(item => {
      saldo += item.ingresos - item.egresos;
      return { ...item, saldo };
    });
  }

  private construirFiltroDashboard(): ReportFilter {
    const { obra, cliente, proveedor, rangoFechas } = this.filtrosDashboard;
    const filtro: ReportFilter = {};

    if (obra?.id) filtro.obraId = obra.id;
    if (cliente?.id) filtro.clienteId = cliente.id;
    if (proveedor?.id) filtro.proveedorId = proveedor.id;
    if (rangoFechas?.[0]) filtro.fechaInicio = this.formatDate(rangoFechas[0]);
    if (rangoFechas?.[1]) filtro.fechaFin = this.formatDate(rangoFechas[1]);

    return filtro;
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
        next: (tipos) => this.tiposProveedor = this.agregarOpcionNuevoTipo(tipos),
        error: () => this.tiposProveedor = this.agregarOpcionNuevoTipo([])
      });
    }
    if (this.gremiosProveedor.length === 0) {
      this.proveedoresService.getGremios().subscribe({
        next: (gremios) => this.gremiosProveedor = this.agregarOpcionNuevoGremio(gremios),
        error: () => this.gremiosProveedor = this.agregarOpcionNuevoGremio([])
      });
    }
  }

  onTipoProveedorChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val !== this.NUEVO_TIPO_VALUE) return;
    this.abrirTipoProveedorModal();
  }

  abrirTipoProveedorModal() {
    this.nuevoTipoProveedorNombre = '';
    this.guardandoTipoProveedor = false;
    this.showTipoProveedorModal = true;
  }

  cerrarTipoProveedorModal() {
    this.showTipoProveedorModal = false;
    this.guardandoTipoProveedor = false;
    this.nuevoTipoProveedorNombre = '';
    if (this.proveedorForm.tipo_proveedor === this.NUEVO_TIPO_VALUE) {
      this.proveedorForm.tipo_proveedor = undefined;
    }
  }

  guardarTipoProveedorModal() {
    const nombre = (this.nuevoTipoProveedorNombre || '').trim();
    if (!nombre || this.guardandoTipoProveedor) return;
    this.guardandoTipoProveedor = true;
    this.proveedoresService.crearTipo(nombre).subscribe({
      next: (tipo) => {
        this.tiposProveedor = this.agregarOpcionNuevoTipo([
          ...this.tiposProveedor.filter(op => op.name !== this.NUEVO_TIPO_VALUE),
          tipo
        ]);
        this.proveedorForm.tipo_proveedor = tipo.name ?? tipo.label ?? tipo;
        this.cerrarTipoProveedorModal();
      },
      error: () => {
        this.guardandoTipoProveedor = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el tipo',
          detail: 'Intentá nuevamente.'
        });
      }
    });
  }

  private agregarOpcionNuevoTipo(tipos: CatalogoOption[]): CatalogoOption[] {
    return [
      ...tipos.filter(op => op?.name !== this.NUEVO_TIPO_VALUE),
      {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
    ];
  }

  private agregarOpcionNuevoGremio(gremios: CatalogoOption[]): CatalogoOption[] {
    return [
      ...gremios.filter(op => op?.name !== this.NUEVO_GREMIO_VALUE),
      {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
    ];
  }

  onGremioChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val !== this.NUEVO_GREMIO_VALUE) return;
    this.abrirGremioModal();
  }

  abrirGremioModal() {
    this.nuevoGremioNombre = '';
    this.guardandoGremio = false;
    this.showGremioModal = true;
  }

  cerrarGremioModal() {
    this.showGremioModal = false;
    this.guardandoGremio = false;
    this.nuevoGremioNombre = '';
    if (this.proveedorForm.gremio === this.NUEVO_GREMIO_VALUE) {
      this.proveedorForm.gremio = undefined;
    }
  }

  guardarGremioModal() {
    const nombre = (this.nuevoGremioNombre || '').trim();
    if (!nombre || this.guardandoGremio) return;
    this.guardandoGremio = true;
    this.proveedoresService.crearGremio(nombre).subscribe({
      next: (gremio) => {
        this.gremiosProveedor = this.agregarOpcionNuevoGremio([
          ...this.gremiosProveedor.filter(op => op.name !== this.NUEVO_GREMIO_VALUE),
          gremio
        ]);
        this.proveedorForm.gremio = gremio.name ?? gremio.label ?? gremio;
        this.cerrarGremioModal();
      },
      error: () => {
        this.guardandoGremio = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el gremio',
          detail: 'Intentá nuevamente.'
        });
      }
    });
  }

  private resetMovimientoForm() {
    this.movimientoObra = null;
    this.movimientoObraDetalle = null;
    this.movimientoClientesObra = [];
    this.movimientoProveedoresObra = [];
    this.filteredMovimientoClientes = [];
    this.filteredMovimientoProveedores = [];
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

  onMovimientoFormaPagoChange(forma: 'TOTAL' | 'PARCIAL') {
    if (forma === 'PARCIAL') {
      this.movimientoForm.monto = 0;
      return;
    }
    if (this.movimientoTipoEntidad === 'CLIENTE') {
      this.aplicarMontoClienteMovimiento();
    } else {
      this.aplicarMontoProveedorMovimiento();
    }
  }

  private aplicarMontoClienteMovimiento() {
    if ((this.movimientoForm.forma_pago || '').toString().toUpperCase() === 'PARCIAL') return;
    const restante = this.movimientoRestanteCliente;
    if (restante == null) return;
    this.movimientoForm.monto = restante;
  }

  private aplicarMontoProveedorMovimiento() {
    if ((this.movimientoForm.forma_pago || '').toString().toUpperCase() === 'PARCIAL') return;
    const saldo = this.movimientoSaldoProveedor;
    if (saldo == null) return;
    this.movimientoForm.monto = saldo;
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
      numero_orden: undefined,
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
      monto: null,
      descripcion: '',
      estado: 'EMITIDA'
    };
    this.facturaFile = null;
    this.facturaRestanteObra = null;
  }

  private actualizarRestanteFacturaObra(obraId: number) {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.facturaRestanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: (facturas) => {
        const facturado = (facturas || []).reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.facturaRestanteObra = Math.max(0, presupuesto - facturado);
      },
      error: () => {
        this.facturaRestanteObra = null;
      }
    });
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
    if (this.movimientoTipoEntidad === 'CLIENTE') {
      return this.validarMontoMovimientoRapidoCliente();
    }
    return true;
  }

  private obtenerObrasFiltradasDashboard(): Obra[] {
    let filtradas = this.obras || [];
    const obraSeleccionada = this.filtrosDashboard?.obra;
    const clienteSeleccionado = this.filtrosDashboard?.cliente;
    const proveedorSeleccionado = this.filtrosDashboard?.proveedor;
    const rangoFechas = this.filtrosDashboard?.rangoFechas;

    if (obraSeleccionada?.id) {
      filtradas = filtradas.filter(obra => Number(obra.id) === Number(obraSeleccionada.id));
    }

    if (clienteSeleccionado?.id) {
      filtradas = filtradas.filter(obra => Number(obra.cliente?.id) === Number(clienteSeleccionado.id));
    }

    if (proveedorSeleccionado?.id) {
      filtradas = filtradas.filter(obra =>
        this.obraTieneProveedor(obra, proveedorSeleccionado.id)
      );
    }

    if (rangoFechas?.[0] || rangoFechas?.[1]) {
      filtradas = filtradas.filter(obra =>
        this.estaEnRangoFecha(this.obtenerFechaCreacionObra(obra), rangoFechas)
      );
    }

    return filtradas;
  }

  private obraTieneProveedor(obra: Obra, proveedorId: number): boolean {
    return (obra?.costos || []).some(c => {
      const id = Number((c as any).id_proveedor ?? (c as any).proveedor?.id ?? 0);
      return id === Number(proveedorId);
    });
  }

  private calcularTotalCostosProveedor(obras: Obra[], proveedorId: number): number {
    const filtradas = this.filtrarObrasConDeuda(obras || []);
    return filtradas.reduce((acc, obra) => {
      const totalObra = (obra?.costos || []).reduce((sum, costo) => {
        const id = Number((costo as any).id_proveedor ?? (costo as any).proveedor?.id ?? 0);
        if (id !== Number(proveedorId)) return sum;
        return sum + this.obtenerSubtotalCosto(costo);
      }, 0);
      return acc + totalObra;
    }, 0);
  }

  private costoTieneProveedor(costo: any): boolean {
    const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
    return id > 0;
  }

  private obtenerSubtotalCosto(costo: any): number {
    if (!this.costoTieneProveedor(costo)) return 0;
    return Number(costo?.subtotal ?? costo?.total ?? 0);
  }

  private obtenerFechaCreacionObra(obra: Obra): string | Date | null {
    return obra?.creado_en ?? obra?.fecha_presupuesto ?? obra?.fecha_inicio ?? null;
  }

  private validarMontoMovimientoRapidoCliente(): boolean {
    const presupuesto = Number(this.movimientoObraDetalle?.presupuesto ?? NaN);
    if (Number.isNaN(presupuesto)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin presupuesto',
        detail: 'No se pudo obtener el presupuesto total de la obra.'
      });
      return false;
    }

    const formaPago = (this.movimientoForm.forma_pago || '').toString().toUpperCase();
    const monto = Number(this.movimientoForm.monto ?? 0);
    const totalPendiente = Number(this.movimientoRestanteCliente ?? presupuesto);
    const diferencia = Math.abs(monto - totalPendiente);

    if (formaPago === 'TOTAL' && diferencia >= 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para cobro total, el monto debe ser igual al restante de la obra.'
      });
      return false;
    }

    if (formaPago === 'PARCIAL' && monto >= totalPendiente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para cobro parcial, el monto debe ser menor al restante de la obra.'
      });
      return false;
    }

    return true;
  }

  private obtenerMensajeError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as any;
      if (typeof body === 'string') return body;
      if (body?.message) return body.message;
      if (body?.error) return body.error;
    }
    return fallback;
  }

  getAsociadoNombre(mov: MovimientoDashboard): string {
    const tipo = (mov.asociadoTipo || '').toString().toUpperCase();
    if (tipo === 'CLIENTE') {
      const cliente = this.clientes.find(c => Number(c.id) === Number(mov.asociadoId));
      if (cliente?.nombre) return cliente.nombre;
    }
    if (tipo === 'PROVEEDOR') {
      const proveedor = this.proveedores.find(p => Number(p.id) === Number(mov.asociadoId));
      if (proveedor?.nombre) return proveedor.nombre;
    }
    return mov.asociadoId ? `Asociado #${mov.asociadoId}` : 'Asociado';
  }

  getProveedorNombreTarea(tarea: Tarea): string {
    if (tarea.proveedor?.nombre) return tarea.proveedor.nombre;
    const proveedorId = tarea.id_proveedor;
    if (!proveedorId) return 'Proveedor';
    const proveedor = this.proveedores.find(p => Number(p.id) === Number(proveedorId));
    return proveedor?.nombre || `Proveedor #${proveedorId}`;
  }
}


