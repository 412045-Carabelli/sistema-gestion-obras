import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, CurrencyPipe, DatePipe, NgClass} from '@angular/common';
import {forkJoin, Subscription} from 'rxjs';

import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressBarModule} from 'primeng/progressbar';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {Select} from 'primeng/select';
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';
import {FileUploadModule} from 'primeng/fileupload';
import {TableModule} from 'primeng/table';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {EditorModule} from 'primeng/editor';
import {TagModule} from 'primeng/tag';

import {Cliente, EstadoObra, Obra, ObraCosto, Proveedor, Tarea, CuentaCorrienteMovimiento, Factura} from '../../../core/models/models';
import {ObraMovimientosComponent} from '../../components/obra-movimientos/obra-movimientos.component';
import {ObraTareasComponent} from '../../components/obra-tareas/obra-tareas.component';

import {ObrasService} from '../../../services/obras/obras.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {ObraDocumentosComponent} from '../../components/obra-documentos/obra-documentos.component';

import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasStateService} from '../../../services/obras/obras-state.service';
import {StyleClassModule} from 'primeng/styleclass';
import {ObraPresupuestoComponent} from '../../components/obra-presupuesto/obra-presupuesto.component';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {CuentaCorrienteObraResponse, ReportFilter} from '../../../core/models/models';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    DropdownModule,
    ObraMovimientosComponent,
    ObraTareasComponent,
    ObraPresupuestoComponent,
    CurrencyPipe,
    DatePipe,
    Select,
    FormsModule,
    InputNumber,
    DatePicker,
    FileUploadModule,
    TableModule,
    ToastModule,
    ObraDocumentosComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StyleClassModule,
    NgClass,
    ModalComponent,
    EditorModule,
    TagModule,
    ConfirmDialog,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obras-detail.component.html',
  styleUrls: ['./obras-detail.component.css']
})
export class ObrasDetailComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('movimientosRef') movimientosRef?: ObraMovimientosComponent;
  @ViewChild('notasBody') notasBody?: ElementRef<HTMLDivElement>;

  obra!: Obra;
  tareas: Tarea[] = [];
  costos: ObraCosto[] = [];
  proveedores!: Proveedor[];
  clientes!: Cliente[];
  cuentaCorrienteObra: CuentaCorrienteObraResponse | null = null;
  facturasObra: Factura[] = [];
  facturasFiltradas: Factura[] = [];
  showFacturaModal = false;
  showFacturaDetalleModal = false;
  facturaDetalle?: Factura;
  facturaForm = {
    fecha: new Date(),
    monto: null as number | null,
    descripcion: '',
    estado: 'EMITIDA'
  };
  facturaFile: File | null = null;
  progresoFisico = 0;
  estadosObra: EstadoObra[] = [];
  estadoSeleccionado: string | null = null;
  showEstadoFechaModal = false;
  estadoPendiente: string | null = null;
  tipoFechaEstado: 'ADJUDICADA' | 'PERDIDA' | null = null;
  fechaEstadoSeleccionada: Date | null = null;
  beneficioNeto = 0;
  beneficioCostos = 0;
  cronogramaFueraDeRango = false;
  memoriaExpandida = false;
  notasExpandida = false;
  notasOverflow = false;

  loading = true;
  private subs = new Subscription();
  private pdfMakeInstance?: any;
  private pdfMakeLoader?: Promise<any>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private obraService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private messageService: MessageService,
    private obraStateService: ObrasStateService,
    private reportesService: ReportesService,
    private facturasService: FacturasService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngAfterViewInit(): void {
    this.scheduleNotasOverflowCheck();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.obraStateService.clearObra();
  }

  get estadoFechaModalTitle(): string {
    return this.tipoFechaEstado === 'PERDIDA'
      ? 'Fecha de perdida'
      : 'Fecha de adjudicacion';
  }

  get estadoFechaLabel(): string {
    return this.tipoFechaEstado === 'PERDIDA'
      ? 'Fecha de perdida'
      : 'Fecha de adjudicacion';
  }

  actualizarEstadoObra(nuevoEstado: string) {
    if (!this.obra?.id) return;
    const estadoNormalizado = (nuevoEstado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    if (!estadoNormalizado || estadoNormalizado === this.obra.obra_estado) {
      this.estadoSeleccionado = this.obra.obra_estado;
      return;
    }

    const tipoFecha = this.requiereFechaEstado(estadoNormalizado);
    if (tipoFecha) {
      this.estadoPendiente = estadoNormalizado;
      this.tipoFechaEstado = tipoFecha;
      this.fechaEstadoSeleccionada = this.obtenerFechaEstadoInicial(tipoFecha);
      this.showEstadoFechaModal = true;
      return;
    }

    this.confirmarCambioEstado(estadoNormalizado);
  }

  cancelarCambioEstado() {
    this.showEstadoFechaModal = false;
    this.estadoPendiente = null;
    this.tipoFechaEstado = null;
    this.fechaEstadoSeleccionada = null;
    this.estadoSeleccionado = this.obra?.obra_estado ?? null;
  }

  confirmarCambioEstadoConFecha() {
    if (!this.estadoPendiente) return;
    if (!this.fechaEstadoSeleccionada) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha requerida',
        detail: 'Selecciona una fecha para confirmar el cambio de estado.'
      });
      return;
    }
    this.confirmarCambioEstado(this.estadoPendiente, this.fechaEstadoSeleccionada);
  }

  private cargarDetalle(idObra: number) {
    this.loading = true;

    forkJoin({
      obra: this.obraService.getObraById(idObra),
      estados: this.estadoObraService.getEstados(),
      proveedores: this.proveedoresService.getProveedores(),
      clientes: this.clientesService.getClientes(),
    }).subscribe({

      next: ({ obra, estados, proveedores, clientes }) => {
        console.log(obra)
        this.obra = { ...obra, id: Number(obra.id) };
        this.tareas = obra.tareas ?? [];
        this.costos = obra.costos ?? [];
        this.estadosObra = estados;

        this.estadoSeleccionado = obra.obra_estado;

        this.clientes = clientes;

        // Mantener todos los proveedores disponibles para permitir sumar costos nuevos
        this.proveedores = proveedores;

        this.progresoFisico = this.getProgresoFisico();
        this.beneficioCostos = obra.beneficio_costos != null
          ? Number(obra.beneficio_costos)
          : this.calcularBeneficioCostos(this.costos);
        this.beneficioNeto = obra.beneficio_neto != null
          ? Number(obra.beneficio_neto)
          : this.calcularBeneficioNeto();
        this.cronogramaFueraDeRango = this.esCronogramaInvalido();
        this.cargarCuentaCorriente(this.obra.id!);
        this.cargarFacturasObra();
        this.loading = false;
        this.obraStateService.setObra(this.obra);
        this.scheduleNotasOverflowCheck();
      },

      error: () => {
        this.loading = false;
        this.obraStateService.clearObra();
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar la obra',
          detail: 'No se pudo obtener la informacion de la obra.'
        });
      }
    });
  }

  onCostosActualizados(costosActualizados: ObraCosto[]) {
    this.costos = costosActualizados;
    this.obra.costos = costosActualizados;
    this.beneficioCostos = this.calcularBeneficioCostos(costosActualizados);
    this.beneficioNeto = this.calcularBeneficioNeto();
    this.obra.presupuesto = this.calcularPresupuestoDesdeCostos(costosActualizados);
    this.obra.beneficio_costos = this.beneficioCostos;
    this.obra.beneficio_neto = this.beneficioNeto;
    this.obraStateService.setObra(this.obra);
  }

  refrescarMovimientos() {
    this.movimientosRef?.cargarDatos();
  }

  getProgresoFisico(): number {
    if (!this.tareas.length) return 0;
    const completadas = this.tareas.filter(t => (t.estado_tarea || '').toUpperCase() === 'COMPLETADA');
    const total = completadas.reduce((acc, t) => acc + Number(t.porcentaje ?? 0), 0);
    return Math.min(Math.round(total), 100);
  }

  private calcularBeneficioNeto(): number {
    const costos = this.obra.costos ?? [];
    const subtotalBase = (costos ?? []).reduce(
      (acc, c) =>
        this.costoTieneProveedor(c)
          ? acc +
          Number(
            c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
          )
          : acc,
      0
    );

    const beneficioCostos = this.calcularBeneficioCostos(costos);
    const totalConBeneficio = subtotalBase + beneficioCostos;

    const comisionPorc = this.obra.tiene_comision ? Number(this.obra.comision ?? 0) : 0;
    const comisionMonto = totalConBeneficio * (comisionPorc / 100);

    return beneficioCostos - comisionMonto;
  }

  private calcularBeneficioCostos(costos: ObraCosto[]): number {
    const beneficioGlobalPorc = this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : null;
    return (costos ?? []).reduce((acc, costo) => {
      const base = Number(
        costo.subtotal ??
        (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0))
      );

      if (!this.costoTieneProveedor(costo)) {
        return acc + base;
      }

      const esAdicional =
        (costo?.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';

      const porc = esAdicional
        ? Number(costo.beneficio ?? 0)
        : (beneficioGlobalPorc !== null ? beneficioGlobalPorc : Number(costo.beneficio ?? 0));

      return acc + base * (porc / 100);
    }, 0);
  }

  private calcularPresupuestoDesdeCostos(costos: ObraCosto[]): number {
    const beneficioGlobalPorc = this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : null;
    const totalConBeneficio = (costos ?? []).reduce((acc, costo) => {
      const subtotal = Number(
        costo.subtotal ??
        (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0))
      );
      const esAdicional = (costo.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const porc = esAdicional
        ? Number(costo.beneficio ?? 0)
        : (beneficioGlobalPorc !== null ? beneficioGlobalPorc : Number(costo.beneficio ?? 0));
      return acc + subtotal * (1 + (porc / 100));
    }, 0);

    const comisionPorc = this.obra.tiene_comision ? Number(this.obra.comision ?? 0) : 0;
    return totalConBeneficio * (1 + (comisionPorc / 100));
  }

  get totalCostosBase(): number {
    return (this.costos ?? []).reduce((acc, costo) => {
      if (!this.costoTieneProveedor(costo)) return acc;
      const subtotal = costo.subtotal ?? (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0));
      return acc + Number(subtotal ?? 0);
    }, 0);
  }

  private esCronogramaInvalido(): boolean {
    const inicio = this.obra.fecha_inicio ? new Date(this.obra.fecha_inicio) : null;
    const fin = this.obra.fecha_fin ? new Date(this.obra.fecha_fin) : null;
    if (!inicio || !fin) return false;
    return fin.getTime() < inicio.getTime();
  }

  private cargarCuentaCorriente(obraId: number) {
    const filtro: ReportFilter = {obraId};
    this.reportesService.getCuentaCorrienteObra(filtro).subscribe({
      next: (data) => this.cuentaCorrienteObra = data,
      error: () => this.cuentaCorrienteObra = null
    });
  }

  private cargarFacturasObra() {
    if (!this.obra?.id) return;
    this.facturasService.getFacturasByObra(this.obra.id).subscribe({
      next: (facturas) => {
        this.facturasObra = facturas || [];
        this.facturasFiltradas = [...this.facturasObra];
      },
      error: () => {
        this.facturasObra = [];
        this.facturasFiltradas = [];
      }
    });
  }

  abrirFacturaModal() {
    this.resetFacturaForm();
    this.showFacturaModal = true;
  }

  cerrarFacturaModal() {
    this.showFacturaModal = false;
  }

  abrirDetalleFactura(factura: Factura) {
    if (!factura) return;
    this.facturaDetalle = factura;
    this.showFacturaDetalleModal = true;
  }

  cerrarDetalleFactura() {
    this.showFacturaDetalleModal = false;
  }

  editarFacturaDetalle() {
    if (!this.facturaDetalle) return;
    this.cerrarDetalleFactura();
    this.editarFactura(this.facturaDetalle);
  }

  guardarFacturaObra() {
    if (!this.obra?.id || !this.obra?.cliente?.id) return;
    const monto = Number(this.facturaForm.monto ?? 0);
    if (!monto || monto <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Ingresa un monto mayor a 0.'
      });
      return;
    }
    const presupuesto = Number(this.obra.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin presupuesto',
        detail: 'No se pudo obtener el presupuesto de la obra.'
      });
      return;
    }
    const restante = Math.max(0, presupuesto - this.totalFacturasMonto);
    if (monto > restante + 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'El monto supera el restante disponible de la obra.'
      });
      return;
    }

    const payload = {
      id_cliente: Number(this.obra.cliente.id),
      id_obra: Number(this.obra.id),
      monto,
      fecha: this.formatDate(this.facturaForm.fecha),
      descripcion: this.facturaForm.descripcion || '',
      estado: this.facturaForm.estado || 'EMITIDA'
    };

    this.facturasService.createFactura(payload, this.facturaFile).subscribe({
      next: () => {
        this.showFacturaModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Factura creada',
          detail: 'La factura se guardo correctamente.'
        });
        this.resetFacturaForm();
        this.cargarFacturasObra();
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

  onFacturaFileSelected(event: any) {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.facturaFile = files?.[0] ?? null;
  }

  quitarFacturaArchivo() {
    this.facturaFile = null;
  }

  descargarAdjuntoFactura(factura: Factura) {
    if (!factura?.id || !factura?.nombre_archivo) return;
    const popup = this.abrirPopup();
    if (!popup) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Bloqueo de ventana',
        detail: 'Habilita los pop-ups para abrir el adjunto.'
      });
      return;
    }
    this.facturasService.downloadFactura(factura.id).subscribe({
      next: (blob) => {
        const baseBlob = blob instanceof Blob ? blob : new Blob([blob]);
        const tipo = this.detectarMime(factura.nombre_archivo, baseBlob.type);
        const fileBlob = tipo ? new Blob([baseBlob], { type: tipo }) : baseBlob;
        const url = window.URL.createObjectURL(fileBlob);
        popup.location.href = url;
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo abrir el adjunto.'
        });
      }
    });
  }

  verDetalleFactura(factura: Factura) {
    if (!factura) return;
    this.abrirDetalleFactura(factura);
  }

  editarFactura(factura: Factura) {
    if (!factura?.id) return;
    this.router.navigate(['/facturas/editar', factura.id]);
  }

  eliminarFactura(factura: Factura, pedirConfirmacion = true) {
    if (!factura?.id) return;
    const eliminar = () => {
      this.facturasService.deleteFactura(factura.id!).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Factura eliminada',
            detail: 'La factura se elimino correctamente.'
          });
          this.cargarFacturasObra();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la factura.'
          });
        }
      });
    };

    if (!pedirConfirmacion) {
      eliminar();
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: '¿Seguro que queres eliminar esta factura?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => eliminar()
    });
  }

  eliminarFacturaDetalle() {
    if (!this.facturaDetalle) return;
    const factura = this.facturaDetalle;
    this.cerrarDetalleFactura();
    this.eliminarFactura(factura, true);
  }

  onTareasActualizadas(nuevasTareas: Tarea[]) {
    this.tareas = nuevasTareas;
    this.obra.tareas = nuevasTareas;

    // Recalcular progreso con los nuevos estados
    this.progresoFisico = this.getProgresoFisico();

    // Guardar estado en el service global
    this.obraStateService.setObra(this.obra);

    // Opcional: mostrar un toast
    this.messageService.add({
      severity: 'success',
      summary: 'Tareas actualizadas',
      detail: 'Se actualizaron correctamente las tareas de esta obra.'
    });
  }

  toggleActivo() {
    this.obraService.activarObra(this.obra.id!).subscribe({
      next: () => {
        this.obra.activo = !this.obra.activo;
        this.obraStateService.setObra(this.obra);
        this.scheduleNotasOverflowCheck();
        this.messageService.add({
          severity: 'success',
          summary: this.obra.activo ? 'Obra activada' : 'Obra desactivada',
          detail: `La obra fue ${this.obra.activo ? 'activada' : 'desactivada'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la obra.'
        });
      }
    });
  }

  toggleMemoria() {
    this.memoriaExpandida = !this.memoriaExpandida;
  }

  toggleNotas() {
    this.notasExpandida = !this.notasExpandida;
    this.scheduleNotasOverflowCheck();
  }

  private scheduleNotasOverflowCheck() {
    setTimeout(() => this.checkNotasOverflow(), 0);
  }

  private checkNotasOverflow() {
    if (!this.notasBody) {
      this.notasOverflow = false;
      return;
    }
    const el = this.notasBody.nativeElement;
    this.notasOverflow = el.scrollHeight > el.clientHeight + 2;
  }

  private requiereFechaEstado(estado: string): 'ADJUDICADA' | 'PERDIDA' | null {
    if (estado === 'ADJUDICADA' || estado === 'EN_PROGRESO') return 'ADJUDICADA';
    if (estado === 'PERDIDA') return 'PERDIDA';
    return null;
  }

  private obtenerFechaEstadoInicial(tipo: 'ADJUDICADA' | 'PERDIDA'): Date {
    const fechaActual =
      tipo === 'PERDIDA'
        ? this.parseDate(this.obra?.fecha_perdida)
        : this.parseDate(this.obra?.fecha_adjudicada);
    return fechaActual ?? new Date();
  }

  private confirmarCambioEstado(estadoNormalizado: string, fechaSeleccionada?: Date | null) {
    if (!this.obra?.id) return;
    const estadoPrevio = this.obra.obra_estado;
    const tipoFecha = this.requiereFechaEstado(estadoNormalizado);

    if (tipoFecha && !fechaSeleccionada) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha requerida',
        detail: 'Selecciona una fecha para confirmar el cambio de estado.'
      });
      return;
    }

    const idCliente = Number(this.obra.id_cliente ?? this.obra.cliente?.id ?? 0);
    if (!idCliente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cliente requerido',
        detail: 'No se pudo determinar el cliente de la obra.'
      });
      this.cancelarCambioEstado();
      return;
    }

    const payload: any = {
      id_cliente: idCliente,
      obra_estado: estadoNormalizado,
      nombre: this.obra.nombre,
      direccion: this.obra.direccion,
      fecha_inicio: this.toDateTimeString(this.obra.fecha_inicio),
      fecha_presupuesto: this.toDateTimeString(this.obra.fecha_presupuesto),
      fecha_fin: this.toDateTimeString(this.obra.fecha_fin),
      fecha_adjudicada: this.toDateTimeString(this.obra.fecha_adjudicada),
      fecha_perdida: this.toDateTimeString(this.obra.fecha_perdida),
      tiene_comision: this.obra.tiene_comision ?? false,
      presupuesto: this.obra.presupuesto,
      beneficio_global: this.obra.beneficio_global,
      beneficio: this.obra.beneficio,
      comision: this.obra.comision,
      notas: this.obra.notas,
      memoria_descriptiva: this.obra.memoria_descriptiva
    };

    if (tipoFecha === 'ADJUDICADA') {
      payload.fecha_adjudicada = this.toDateTimeString(fechaSeleccionada);
    }
    if (tipoFecha === 'PERDIDA') {
      payload.fecha_perdida = this.toDateTimeString(fechaSeleccionada);
    }

    this.obraService.updateObra(this.obra.id!, payload).subscribe({
      next: (updated) => {
        const encontrado = this.estadosObra.find(
          e => e.name === estadoNormalizado || e.label === estadoNormalizado
        );
        this.obra = {
          ...this.obra,
          ...updated,
          obra_estado: updated?.obra_estado ?? estadoNormalizado,
          fecha_adjudicada: updated?.fecha_adjudicada ?? payload.fecha_adjudicada ?? this.obra.fecha_adjudicada,
          fecha_perdida: updated?.fecha_perdida ?? payload.fecha_perdida ?? this.obra.fecha_perdida
        };
        this.estadoSeleccionado = estadoNormalizado;
        this.obraStateService.setObra(this.obra);
        this.scheduleNotasOverflowCheck();
        this.cancelarCambioEstado();
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: 'La obra ahora esta en estado "' + (encontrado?.label ?? this.obra.obra_estado) + '".'
        });
      },
      error: () => {
        this.estadoSeleccionado = estadoPrevio ?? this.obra.obra_estado;
        this.cancelarCambioEstado();
        this.messageService.add({
          severity: 'error',
          summary: 'Estado actualizado',
          detail: 'El estado de la obra no se pudo actualizar',
        });
      }
    });
  }

  private parseDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateTimeString(value?: string | Date | null): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hour = String(value.getHours()).padStart(2, '0');
    const minute = String(value.getMinutes()).padStart(2, '0');
    const second = String(value.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  get totalFacturasMonto(): number {
    return (this.facturasFiltradas || []).reduce((acc, factura) => acc + Number(factura.monto ?? 0), 0);
  }

  async exportarResumenPdf() {
    if (!this.obra) return;

    const pdfMake = await this.loadPdfMake();
    const logoDataUrl = await this.obtenerLogoDataUrl();
    const fechaHoy = new Date().toLocaleDateString('es-AR');
    const cliente = this.obra.cliente;

    const formatCurrency = (valor: number) =>
      (valor || 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'});

    const filasCostos = (this.costos ?? []).map(c => {
      const subtotalBase = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      const tieneProveedor = this.costoTieneProveedor(c);
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const beneficioAplicado = esAdicional
        ? Number(c.beneficio ?? 0)
        : (this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : Number(c.beneficio ?? 0));
      const totalConBeneficio = tieneProveedor
        ? subtotalBase * (1 + beneficioAplicado / 100)
        : subtotalBase;

      return [
        {text: c.descripcion, fontSize: 9},
        {text: c.proveedor?.nombre ?? '-', fontSize: 9},
        {text: formatCurrency(subtotalBase), fontSize: 9, alignment: 'right'},
        {text: formatCurrency(totalConBeneficio), fontSize: 9, alignment: 'right'},
        {text: c.estado_pago ?? '-', alignment: 'center', fontSize: 9}
      ];
    });

    const subtotalCostos = (this.costos ?? []).reduce(
      (acc, c) =>
        this.costoTieneProveedor(c)
          ? acc + Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)))
          : acc,
      0
    );
    const beneficioCostos = (this.costos ?? []).reduce((acc, c) => {
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const beneficio = esAdicional
        ? Number(c.beneficio ?? 0)
        : (this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : Number(c.beneficio ?? 0));
      const base = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      if (!this.costoTieneProveedor(c)) {
        return acc + base;
      }
      return acc + base * (beneficio / 100);
    }, 0);
    const totalCostos = subtotalCostos + beneficioCostos;
    const comisionPorc = this.obra.tiene_comision ? Number(this.obra.comision ?? 0) : 0;
    const comisionMonto = totalCostos * (comisionPorc / 100);
    const totalCostosConComision = totalCostos + comisionMonto;

    const tareasPendientes = (this.tareas ?? []).filter(t => {
      const estado = (t.estado_tarea || '').toUpperCase();
      return estado !== 'COMPLETADA' && estado !== 'EN_PROGRESO';
    });
    const tareasEnProgreso = (this.tareas ?? []).filter(
      t => (t.estado_tarea || '').toUpperCase() === 'EN_PROGRESO'
    );
    const tareasCompletadas = (this.tareas ?? []).filter(
      t => (t.estado_tarea || '').toUpperCase() === 'COMPLETADA'
    );
    const tareaTexto = (t: Tarea) =>
      [
        `Proveedor: ${this.nombreProveedorTarea(t)}`,
        `Título: ${t.nombre}`,
        `Descripción: ${t.descripcion?.trim() || '-'}`,
      ].join('\n');
    const maxFilasTareas = Math.max(
      tareasPendientes.length,
      tareasEnProgreso.length,
      tareasCompletadas.length
    );
    const filasTareas = [];
    for (let i = 0; i < maxFilasTareas; i++) {
      filasTareas.push([
        {text: tareasPendientes[i] ? tareaTexto(tareasPendientes[i]) : '-', fontSize: 9},
        {text: tareasEnProgreso[i] ? tareaTexto(tareasEnProgreso[i]) : '-', fontSize: 9},
        {text: tareasCompletadas[i] ? tareaTexto(tareasCompletadas[i]) : '-', fontSize: 9}
      ]);
    }

    const cc = this.cuentaCorrienteObra;
    const movimientos = cc?.movimientos ?? [];
    const totalesIngresos = cc?.totalIngresos ?? 0;
    const totalesEgresos = cc?.totalEgresos ?? 0;
    const saldoFinal = cc?.saldoFinal ?? (totalesIngresos - totalesEgresos);
    const totalCobrosMov = movimientos
      .filter(m => (m.tipo || '').toUpperCase() === 'COBRO')
      .reduce((acc, m) => acc + (m.monto ?? 0), 0);
    const totalPagosMov = movimientos
      .filter(m => {
        const tipo = (m.tipo || '').toUpperCase();
        return tipo === 'PAGO' || tipo === 'COSTO';
      })
      .reduce((acc, m) => acc + (m.monto ?? 0), 0);
    const totalCobros = totalCobrosMov || totalesIngresos;
    const totalPagos = totalPagosMov || totalesEgresos;
    const saldoFinalTabla = totalCobros - totalPagos;

    const filasMov = movimientos.length
      ? movimientos.map(m => ([
          {text: m.fecha ? new Date(m.fecha).toLocaleDateString('es-AR') : '-', fontSize: 9},
          {text: m.tipo || '-', fontSize: 9},
          {text: m.concepto || m.referencia || '-', fontSize: 9},
          {text: this.nombreAsociadoMovimiento(m), fontSize: 9},
          {text: formatCurrency(m.monto ?? 0), alignment: 'right', fontSize: 9}
        ]))
      : [[
          {text: 'No hay movimientos registrados', colSpan: 5, alignment: 'center', fontSize: 9, italics: true},
          {}, {}, {}, {}
        ]];

    const saldoClienteFinal = obtenerSaldoFinal('saldoCliente') ?? saldoFinal;
    const saldoProveedorFinal = obtenerSaldoFinal('saldoProveedor') ?? 0;

    const docDefinition: any = {
      pageMargins: [20, 20, 20, 20],
      content: [
        logoDataUrl ? {image: logoDataUrl, width: 620, alignment: 'center', margin: [0, 0, 0, 12]} : {text: ''},
        {text: 'Resumen de Obra', alignment: 'center', fontSize: 16, bold: true},
        {text: fechaHoy, alignment: 'center', margin: [0, 0, 0, 10]},

        {text: 'Datos de la obra', style: 'sectionHeader'},
        {
          columns: [
            [
              {text: `Nombre: ${this.obra.nombre}`, margin: [0, 0, 0, 4]},
              {text: `Direccion: ${this.obra.direccion ?? '-'}`, margin: [0, 0, 0, 4]},
              {text: `Estado: ${this.formatearEstado(this.obra.obra_estado)}`, margin: [0, 0, 0, 4]},
              {text: `Inicio: ${this.obra.fecha_inicio ? new Date(this.obra.fecha_inicio).toLocaleDateString('es-AR') : '-'}`, margin: [0, 0, 0, 4]},
              {text: `Fin: ${this.obra.fecha_fin ? new Date(this.obra.fecha_fin).toLocaleDateString('es-AR') : '-'}`, margin: [0, 0, 0, 4]}
            ],
            [
              {text: `Presupuesto: ${(this.obra.presupuesto ?? 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}`, margin: [0, 0, 0, 6]},
              {text: `Comision: ${this.obra.comision ?? 0}% (${((this.obra.presupuesto || 0) * ((this.obra.comision ?? 0) / 100)).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})})`, margin: [0, 0, 0, 6]}
            ]
          ]
        },

        {text: '\nDatos del cliente', style: 'sectionHeader'},
        {
          columns: [
            [
              {text: cliente?.nombre ?? '-'},
              {text: `CUIT: ${cliente?.cuit ?? '-'}`},
              {text: `Email: ${cliente?.email ?? '-'}`},
              {text: `Telefono: ${cliente?.telefono ?? '-'}`}
            ]
          ]
        },

        {text: '\nCostos', style: 'sectionHeader'},
        {
          table: {
            widths: ['*', 120, 80, 80, 80],
            body: [
              [
                {text: 'Descripcion', bold: true},
                {text: 'Proveedor', bold: true},
                {text: 'Subtotal', bold: true, alignment: 'right'},
                {text: 'Total', bold: true, alignment: 'right'},
                {text: 'Estado', bold: true, alignment: 'center'}
              ],
              ...filasCostos
            ]
          }
        },
        {
          alignment: 'right',
          margin: [0, 6, 0, 12],
          table: {
            widths: ['*', 170],
            body: [
              ['Subtotal sin beneficio', formatCurrency(subtotalCostos)],
              ['Beneficio neto', formatCurrency(beneficioCostos)],
              ['Subtotal con beneficio', formatCurrency(totalCostos)],
              ['Comision', formatCurrency(comisionMonto)],
              ['Total costos', formatCurrency(totalCostosConComision)]
            ]
          },
          layout: 'noBorders'
        },

        {
          text: 'Tareas',
          style: 'sectionHeader',
          margin: [0, 10, 0, 4],
          pageBreak: 'before'
        },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                {text: `Pendientes (${tareasPendientes.length})`, bold: true, alignment: 'center'},
                {text: `En progreso (${tareasEnProgreso.length})`, bold: true, alignment: 'center'},
                {text: `Completadas (${tareasCompletadas.length})`, bold: true, alignment: 'center'}
              ],
              ...(filasTareas.length
                ? filasTareas
                : [[
                    {text: 'Sin tareas pendientes', italics: true, alignment: 'center', fontSize: 9},
                    {text: 'Sin tareas en progreso', italics: true, alignment: 'center', fontSize: 9},
                    {text: 'Sin tareas completadas', italics: true, alignment: 'center', fontSize: 9}
                  ]])
            ]
          }
        },

        {
          text: '\nMovimientos de la obra',
          style: 'sectionHeader',
          margin: [0, 10, 0, 4],
          pageBreak: 'before'
        },
        {
          table: {
            widths: [70, 50, '*', 110, 70],
            body: [
              [
                {text: 'Fecha', bold: true},
                {text: 'Tipo', bold: true},
                {text: 'Concepto', bold: true},
                {text: 'Asociado', bold: true},
                {text: 'Monto', bold: true, alignment: 'right'}
              ],
              ...filasMov
            ]
          }
        },

        {
          alignment: 'right',
          margin: [0, 6, 0, 0],
          table: {
            widths: ['*', 120],
            body: [
              ['Total cobros', formatCurrency(totalCobros)],
              ['Total pagos', formatCurrency(totalPagos)],
              ['Saldo final', formatCurrency(saldoFinalTabla)]
            ]
          },
          layout: 'noBorders'
        },

      ],
      styles: {
        sectionHeader: {fontSize: 12, bold: true, margin: [0, 10, 0, 4]}
      }
    };

    pdfMake.createPdf(docDefinition).download(`Resumen_Obra_${this.obra.id ?? ''}.pdf`);

    function obtenerSaldoFinal(campo: 'saldoCliente' | 'saldoProveedor'): number | null {
      const mov = [...movimientos].reverse().find(item => typeof item[campo] === 'number');
      return (mov?.[campo] as number | undefined) ?? null;
    }

    function descripcionSaldo(tipo: 'cliente' | 'proveedor', valor: number): string {
      if (valor > 0) {
        return tipo === 'cliente'
          ? 'Monto pendiente de cobro al cliente.'
          : 'Monto pendiente de pago al proveedor.';
      }
      if (valor < 0) {
        return tipo === 'cliente'
          ? `Tienes ${formatCurrency(Math.abs(valor))} a favor del cliente.`
          : `Tienes ${formatCurrency(Math.abs(valor))} a favor con el proveedor.`;
      }
      return 'Cuenta saldada.';
    }
  }

  private loadPdfMake(): Promise<any> {
    if (this.pdfMakeInstance) {
      return Promise.resolve(this.pdfMakeInstance);
    }
    if (!this.pdfMakeLoader) {
      this.pdfMakeLoader = Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts')
      ]).then(([pdfMakeModule, pdfFonts]) => {
        const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
        pdfMake.vfs = ((pdfFonts as any).default || pdfFonts as any).vfs;
        this.pdfMakeInstance = pdfMake;
        return pdfMake;
      });
    }
    return this.pdfMakeLoader;
  }

  private async obtenerLogoDataUrl(): Promise<string | undefined> {
    const base = window.location.origin;
    const candidates = [
      `${base}/assets/logo-meliquina.png`,
      `${base}/logo-meliquina.png`
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const blob = await response.blob();
        // eslint-disable-next-line no-await-in-loop
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Resultado de logo no es una cadena'));
          };
          reader.onerror = () => reject(new Error('No se pudo leer el logo'));
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      } catch {
        // probar siguiente
      }
    }
    console.error('No se pudo cargar el logo de la cotizacion', {candidates});
    return undefined;
  }

  private formatearEstado(estado?: string | null): string {
    if (!estado) return '-';
    return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  private nombreProveedorTarea(t: Tarea): string {
    if (t.proveedor?.nombre) return t.proveedor.nombre;
    if (t.id_proveedor) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(t.id_proveedor));
      if (prov) return prov.nombre;
    }
    return '-';
  }

  private nombreAsociado(tipo?: string, id?: number): string {
    if (!id) return '-';
    const t = (tipo || '').toString().toUpperCase();
    if (t === 'CLIENTE') {
      return this.clientes.find(c => Number(c.id) === Number(id))?.nombre ?? `Cliente #${id}`;
    }
    if (t === 'PROVEEDOR') {
      return this.proveedores?.find(p => Number(p.id) === Number(id))?.nombre ?? `Proveedor #${id}`;
    }
    return `#${id}`;
  }

  private nombreAsociadoMovimiento(mov: CuentaCorrienteMovimiento): string {
    const tipo = (mov.asociadoTipo || '').toUpperCase();
    const id = mov.asociadoId;

    if (tipo === 'PROVEEDOR' && id) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(id));
      if (prov?.nombre) return prov.nombre;
      return `Proveedor #${id}`;
    }

    if (tipo === 'CLIENTE') {
      if (id) {
        const cli = this.clientes?.find(c => Number(c.id) === Number(id));
        if (cli?.nombre) return cli.nombre;
      }
      // fallback al cliente de la obra
      if (this.obra?.cliente?.nombre) return this.obra.cliente.nombre;
      return id ? `Cliente #${id}` : 'Cliente';
    }

    // Fallback: si es un costo y no viene asociado, intentamos inferir proveedor por la descripcion del costo
    if ((mov.tipo || '').toUpperCase() === 'COSTO') {
      const proveedorInferido = this.proveedorPorConcepto(mov.concepto || mov.referencia || '');
      if (proveedorInferido) return proveedorInferido;
      return 'Proveedor';
    }

    // Fallback gen�rico: si es cobro sin asociado, asumimos cliente de la obra
    if ((mov.tipo || '').toUpperCase() === 'COBRO') {
      return this.obra?.cliente?.nombre || 'Cliente';
    }

    return tipo || '-';
  }

  private proveedorPorConcepto(concepto: string): string | null {
    if (!concepto || !this.obra?.costos?.length) return null;
    const match = this.obra.costos.find(c =>
      c.descripcion?.trim().toLowerCase() === concepto.trim().toLowerCase()
    );
    if (match?.proveedor?.nombre) return match.proveedor.nombre;
    if (match?.id_proveedor) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(match.id_proveedor));
      if (prov?.nombre) return prov.nombre;
    }
    return null;
  }

  private costoTieneProveedor(costo: ObraCosto): boolean {
    const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
    return id > 0;
  }

  private resetFacturaForm() {
    this.facturaForm = {
      fecha: new Date(),
      monto: null,
      descripcion: '',
      estado: 'EMITIDA'
    };
    this.facturaFile = null;
  }

  stripFacturaDescripcion(raw?: string | null): string {
    if (!raw) return '';
    return raw.replace(/<[^>]*>/g, '').trim();
  }

  private abrirPopup(): Window | null {
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.write('<p>Cargando adjunto...</p>');
    }
    return popup;
  }

  private detectarMime(nombre?: string, baseType?: string | null): string | null {
    if (baseType) return baseType;
    if (!nombre) return null;
    const lower = nombre.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return null;
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }
}









