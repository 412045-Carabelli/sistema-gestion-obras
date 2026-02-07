import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  Output,
  EventEmitter,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import {ConfirmationService, MessageService} from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  EstadoPago,
  Obra,
  ObraCosto,
  Proveedor,
} from '../../../core/models/models';
import { EstadoPagoService } from '../../../services/estado-pago/estado-pago.service';
import { CostosService } from '../../../services/costos/costos.service';
import { Select } from 'primeng/select';
import { ModalComponent } from '../../../shared/modal/modal.component';
import {ConfirmDialog} from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { EditorModule } from 'primeng/editor';
import {ProveedorQuickCreateComponent} from '../proveedor-quick-create/proveedor-quick-create.component';
import { DocumentosService } from '../../../services/documentos/documentos.service';
import { TransaccionesService } from '../../../services/transacciones/transacciones.service';

// PDFMAKE
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ObrasService } from '../../../services/obras/obras.service';

pdfMake.vfs = pdfFonts.vfs;


@Component({
  selector: 'app-obra-presupuesto',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    CheckboxModule,
    InputNumber,
    FormsModule,
    ToastModule,
    NgClass,
    Select,
    AutoCompleteModule,
    ModalComponent,
    MenuModule,
    EditorModule,
    ConfirmDialog,
    ProveedorQuickCreateComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obra-presupuesto.component.html',
  styleUrls: ['./obra-presupuesto.component.css']
})
export class ObraPresupuestoComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('memoriaBody') memoriaBody?: ElementRef<HTMLDivElement>;
  @Input() obra!: Obra;

  @Input() proveedores: Proveedor[] = [];
  @Input() costos: ObraCosto[] = [];

  @Input() usarBeneficioGlobal = false;
  @Input() beneficioGlobal = 0;
  @Input() tieneComision = false;
  @Input() comision = 0;
  get Comision(): number {
    return this.comision;
  }

  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();
  @Output() movimientoCreado = new EventEmitter<void>();
  @Output() beneficioGlobalActualizado = new EventEmitter<{ beneficio_global: boolean; beneficio: number }>();
  @Output() documentoCreado = new EventEmitter<void>();

  costosFiltrados: ObraCosto[] = [];
  estadosPagoRecords: { label: string; name: string }[] = [];
  loading = true;
  nuevoCosto: Partial<ObraCosto> = this.getNuevoCostoBase();
  nuevoCostoProveedor?: Proveedor | null;
  showProveedorModal = false;
  private readonly NUEVO_PROVEEDOR_ID = 0;
  private readonly nuevoProveedorOption: Proveedor = { id: this.NUEVO_PROVEEDOR_ID, nombre: 'Crear proveedor...' } as Proveedor;
  private proveedorTarget: ObraCosto | 'nuevo' | null = null;
  filteredProveedores: Proveedor[] = [];
  exportOptions: MenuItem[] = [];
  tipoCostoOptions = [
    { label: 'Original', value: 'ORIGINAL' },
    { label: 'Adicional', value: 'ADICIONAL' }
  ];
  private pdfMakeReady = false;
  showCostoDetalleModal = false;
  costoDetalle?: ObraCosto;
  costoDetalleEditando = false;
  costoDetalleDraft?: ObraCosto;

  memoriaExpandida = false;
  memoriaOverflow = false;
  memoriaEditando = false;
  memoriaDraft = '';
  guardandoMemoria = false;
  condicionesEditando = false;
  condicionesDraft = '';
  observacionesDraft = '';
  private readonly condicionesDefaultTexto =
    'Validez de oferta: 7 dias corridos.\nForma de pago: Al finalizar las tareas.';
  guardandoCondiciones = false;
  showBeneficioGlobalModal = false;
  beneficioGlobalDraft = 0;
  beneficioGlobalActivoDraft = false;
  guardandoBeneficioGlobal = false;
  exportandoPdf = false;

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService,
    private obrasService: ObrasService,
    private confirmationService: ConfirmationService,
    private documentosService: DocumentosService,
    private transaccionesService: TransaccionesService
  ) {}

  pagandoComision = false;
  comisionPagada = false;

  ngOnInit() {
    this.filteredProveedores = this.appendNuevoProveedorOption(this.proveedores || []);
    this.nuevoCostoProveedor = undefined;
    if (this.costos?.length > 0) {
      this.inicializarCostos();
    }
    this.cargarEstadosDePago();
    this.ajustarTipoCostoNuevoSegunEstado();
    this.recargarEstadoComision();
    this.exportOptions = [
      {
        label: 'Itemizado',
        icon: 'pi pi-list',
        command: () => this.exportarPDF('DETALLADO')
      },
      {
        label: 'Global',
        icon: 'pi pi-align-left',
        command: () => this.exportarPDF('MEMORIA')
      }
    ];
  }

  ngAfterViewInit(): void {
    this.scheduleMemoriaOverflowCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costos'] && this.costos?.length > 0) {
      this.inicializarCostos();
    }
    if (changes['obra']) {
      this.ajustarTipoCostoNuevoSegunEstado();
      this.scheduleMemoriaOverflowCheck();
      this.recargarEstadoComision();
    }
    if (changes['beneficioGlobal'] || changes['tieneComision']) {
      this.costosFiltrados = this.costosFiltrados.map(c => ({ ...c }));
      this.costosFiltrados.forEach(c => this.recalcularEnEdicion(c));
      if (this.usarBeneficioGlobal && this.nuevoCosto.tipo_costo !== 'ADICIONAL') {
        this.nuevoCosto.beneficio = this.beneficioGlobal;
      }
    }
    if (changes['proveedores']) {
      this.filteredProveedores = this.appendNuevoProveedorOption(this.proveedores || []);
    }
  }

  actualizarEstadoPago(c: ObraCosto, nuevoEstadoName: string) {
    this.actualizarEstadoPagoDirecto(c, nuevoEstadoName);
  }

  abrirModalProveedor() {
    this.showProveedorModal = true;
  }

  cerrarModalProveedor() {
    this.showProveedorModal = false;
    this.proveedorTarget = null;
  }

  onProveedorCreado(proveedor: Proveedor) {
    if (!proveedor) return;
    this.proveedores = [...this.proveedores, proveedor];
    this.filteredProveedores = this.appendNuevoProveedorOption(this.proveedores);
    if (this.proveedorTarget === 'nuevo') {
      this.nuevoCostoProveedor = proveedor;
      this.nuevoCosto.id_proveedor = proveedor.id;
      this.nuevoCosto.proveedor = proveedor;
    } else if (this.proveedorTarget) {
      this.proveedorTarget.proveedor = proveedor;
      this.proveedorTarget.id_proveedor = proveedor.id;
    }
    this.proveedorTarget = null;
    this.showProveedorModal = false;
  }

  abrirBeneficioGlobalModal() {
    if (!this.permiteBeneficioGlobal()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Beneficio global bloqueado',
        detail: 'Solo se puede modificar cuando la obra no está adjudicada, en progreso o finalizada.'
      });
      return;
    }
    this.beneficioGlobalActivoDraft = !!this.usarBeneficioGlobal;
    this.beneficioGlobalDraft = Number(this.beneficioGlobal ?? 0);
    this.showBeneficioGlobalModal = true;
  }

  cerrarBeneficioGlobalModal() {
    if (this.guardandoBeneficioGlobal) return;
    this.showBeneficioGlobalModal = false;
  }

  guardarBeneficioGlobal() {
    if (!this.obra?.id || this.guardandoBeneficioGlobal) return;
    this.guardandoBeneficioGlobal = true;
    const payload: any = {
      id: this.obra.id,
      id_cliente: this.obra.id_cliente ?? this.obra.cliente?.id,
      obra_estado: this.obra.obra_estado,
      nombre: this.obra.nombre,
      direccion: this.obra.direccion,
      fecha_inicio: this.obra.fecha_inicio,
      fecha_presupuesto: this.obra.fecha_presupuesto,
      fecha_fin: this.obra.fecha_fin,
      fecha_adjudicada: this.obra.fecha_adjudicada,
      fecha_perdida: this.obra.fecha_perdida,
      tiene_comision: this.obra.tiene_comision ?? false,
      presupuesto: this.obra.presupuesto,
      beneficio_global: this.beneficioGlobalActivoDraft,
      beneficio: Number(this.beneficioGlobalDraft ?? 0),
      comision: this.obra.comision,
      notas: this.obra.notas,
      memoria_descriptiva: this.obra.memoria_descriptiva,
      condiciones_presupuesto: this.obra.condiciones_presupuesto,
      observaciones_presupuesto: this.obra.observaciones_presupuesto,
      requiere_factura: this.obra.requiere_factura
    };
    Object.keys(payload).forEach(
      key => payload[key] === undefined && delete payload[key]
    );

    this.obrasService.updateObra(this.obra.id, payload).subscribe({
      next: (updated) => {
        this.obra = {
          ...this.obra,
          beneficio_global: updated?.beneficio_global ?? payload.beneficio_global,
          beneficio: updated?.beneficio ?? payload.beneficio
        };
        this.usarBeneficioGlobal = !!this.obra.beneficio_global;
        this.beneficioGlobal = Number(this.obra.beneficio ?? 0);
        this.showBeneficioGlobalModal = false;
        this.guardandoBeneficioGlobal = false;
        this.costosFiltrados = this.costosFiltrados.map(c => ({ ...c }));
        this.costosFiltrados.forEach(c => this.recalcularEnEdicion(c));
        if (this.usarBeneficioGlobal && this.nuevoCosto.tipo_costo !== 'ADICIONAL') {
          this.nuevoCosto.beneficio = this.beneficioGlobal;
        }
        this.beneficioGlobalActualizado.emit({
          beneficio_global: this.usarBeneficioGlobal,
          beneficio: this.beneficioGlobal
        });
        this.costosActualizados.emit([...this.costosFiltrados]);
        this.messageService.add({
          severity: 'success',
          summary: 'Beneficio global actualizado',
          detail: 'Se guardaron los cambios.'
        });
      },
      error: () => {
        this.guardandoBeneficioGlobal = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el beneficio global.'
        });
      }
    });
  }

  agregarCosto() {
    if (this.estaSelladaCotizacion() && this.nuevoCosto.tipo_costo !== 'ADICIONAL') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cotizacion sellada',
        detail: 'No podes agregar costos originales mientras la obra esta en progreso.'
      });
      return;
    }
    const esAdicional = this.nuevoCosto.tipo_costo === 'ADICIONAL';
    const subtotalNuevo = this.calcularMontosPayload(this.nuevoCosto).subtotal;
    if (!esAdicional && (!this.nuevoCosto.descripcion || !this.nuevoCosto.id_proveedor)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa proveedor y descripcion para agregar el costo.'
      });
      return;
    }
    if (esAdicional && subtotalNuevo <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Importe invalido',
        detail: 'Ingresa un importe mayor a 0 para el adicional.'
      });
      return;
    }

    if (!this.nuevoCosto.tipo_costo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta tipo de costo',
        detail: 'Selecciona si el costo es ORIGINAL o ADICIONAL.'
      });
      return;
    }

    if (esAdicional && !this.nuevoCosto.descripcion) {
      this.nuevoCosto.descripcion = 'Adicional';
    }

    const payload = this.calcularMontosPayload(this.nuevoCosto);
    this.costosService
      .createCosto({ ...payload, id_obra: this.obra.id })
      .subscribe({
        next: creado => {
          const actualizado = {
            ...creado,
            ...payload,
            enEdicion: false
          } as ObraCosto;
          this.costosFiltrados = this.ordenarCostos([...this.costosFiltrados, actualizado]);
          this.costosActualizados.emit(this.costosFiltrados);
          this.nuevoCosto = this.getNuevoCostoBase();
          this.messageService.add({
            severity: 'success',
            summary: 'Costo agregado',
            detail: 'Se agrego un nuevo costo a la matriz.'
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el costo.'
          });
        }
      });
  }

  habilitarEdicion(costo: any) {
    if (this.estaSelladaCotizacion() && !this.esAdicional(costo)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cotizacion sellada',
        detail: 'No podes editar costos originales mientras la obra esta en progreso.'
      });
      return;
    }
    costo._backup = {...costo};
    costo.enEdicion = true;
  }

  abrirDetalleCosto(costo: ObraCosto, editar = true) {
    if (!costo) return;
    this.costoDetalle = costo;
    this.costoDetalleDraft = {
      ...costo,
      proveedor: costo.proveedor ?? this.proveedores.find(p => Number(p.id) === Number(costo.id_proveedor))
    };
    if (editar && !this.puedeEditarCosto(costo)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Edicion no disponible',
        detail: 'No podes editar este costo en el estado actual de la obra.'
      });
      this.costoDetalleEditando = false;
    } else {
      this.costoDetalleEditando = editar;
    }
    this.showCostoDetalleModal = true;
  }

  cerrarDetalleCosto() {
    this.showCostoDetalleModal = false;
    this.costoDetalleEditando = false;
  }


  editarDetalleCosto() {
    if (!this.costoDetalle) return;
    if (!this.puedeEditarCosto(this.costoDetalle)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Edicion no disponible',
        detail: 'No podes editar este costo en el estado actual de la obra.'
      });
      return;
    }
    this.costoDetalleEditando = true;
  }

  cancelarEdicionDetalleCosto() {
    if (!this.costoDetalle) return;
    this.costoDetalleDraft = {
      ...this.costoDetalle,
      proveedor: this.costoDetalle.proveedor ?? this.proveedores.find(p => Number(p.id) === Number(this.costoDetalle?.id_proveedor))
    };
    this.costoDetalleEditando = false;
  }

  guardarDetalleCosto() {
    if (!this.costoDetalleDraft?.id) return;
    if (!this.puedeEditarCosto(this.costoDetalleDraft)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Edicion no disponible',
        detail: 'No podes editar este costo en el estado actual de la obra.'
      });
      return;
    }
    const payload = this.calcularMontosPayload(this.costoDetalleDraft);
    this.costosService.updateCosto(this.costoDetalleDraft.id, payload).subscribe({
      next: actualizado => {
        const actualizadoFull = {
          ...this.costoDetalleDraft,
          ...actualizado,
          ...payload
        } as ObraCosto;
        this.costoDetalle = actualizadoFull;
        this.costoDetalleDraft = { ...actualizadoFull };
        this.costosFiltrados = this.costosFiltrados.map(c =>
          c.id === actualizadoFull.id ? { ...c, ...actualizadoFull } : c
        );
        this.costosActualizados.emit([...this.costosFiltrados]);
        this.costoDetalleEditando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Costo actualizado',
          detail: 'Los cambios se guardaron correctamente.'
        });
        this.cerrarDetalleCosto();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el costo.'
        });
      }
    });
  }

  eliminarDetalleCosto() {
    if (!this.costoDetalle?.id) return;
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: '¿Seguro que queres eliminar este costo?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.eliminarCosto(this.costoDetalle!);
        this.cerrarDetalleCosto();
      }
    });
  }

  recalcularEnEdicion(costo: any) {
    const { subtotal, total } = this.calcularMontosPayload(costo);
    costo.subtotal = subtotal;
    costo.total = total;
    costo.tipo_costo = (costo.tipo_costo as 'ORIGINAL' | 'ADICIONAL') || 'ORIGINAL';
  }

  onTipoCostoNuevoChange(tipo: 'ORIGINAL' | 'ADICIONAL') {
    if (tipo === 'ADICIONAL' && this.usarBeneficioGlobal) {
      this.nuevoCosto.beneficio = 0;
    }
    if (tipo === 'ORIGINAL' && this.usarBeneficioGlobal) {
      this.nuevoCosto.beneficio = this.beneficioGlobal;
    }
  }

  guardarEdicion(costo: any) {
    if (this.estaSelladaCotizacion() && !this.esAdicional(costo)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cotizacion sellada',
        detail: 'No podes editar costos originales mientras la obra esta en progreso.'
      });
      return;
    }
    const payload = this.calcularMontosPayload(costo);
    this.costosService.updateCosto(costo.id, payload).subscribe({
      next: actualizado => {
        Object.assign(costo, actualizado, payload, { enEdicion: false });
        this.costosFiltrados = this.ordenarCostos([...this.costosFiltrados]);
        delete costo._backup;
        this.costosActualizados.emit([...this.costosFiltrados]);
        this.messageService.add({
          severity: 'success',
          summary: 'Costo actualizado',
          detail: 'Los cambios se guardaron correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el costo.'
        });
      }
    });
  }

  cancelarEdicion(costo: any) {
    if (costo._backup) {
      Object.assign(costo, costo._backup);
      delete costo._backup;
    }
    costo.enEdicion = false;
    // Recalcular montos por si dependemos de beneficio global
    const recalculado = this.calcularMontosPayload(costo);
    costo.subtotal = recalculado.subtotal;
    costo.total = recalculado.total;
  }

  eliminarCosto(costo: any) {
    if (!costo.id) return;
    if (this.estaSelladaCotizacion() && !this.esAdicional(costo)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cotizacion sellada',
        detail: 'No podes eliminar costos originales mientras la obra esta en progreso.'
      });
      return;
    }
    this.costosService.deleteCosto(costo.id).subscribe({
      next: () => {
        this.costosFiltrados = this.costosFiltrados.filter(
          c => c.id !== costo.id
        );
        this.costosActualizados.emit(this.costosFiltrados);
        this.messageService.add({
          severity: 'success',
          summary: 'Costo eliminado',
          detail: 'El costo fue eliminado de la matriz.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el costo.'
        });
      }
    });
  }

  confirmarEliminarCosto(costo: ObraCosto) {
    if (!costo?.id) return;
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: '¿Seguro que queres eliminar este costo?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.eliminarCosto(costo)
    });
  }

  calcularTotal(): number {
    return this.calcularTotalConBeneficio();
  }

  calcularNuevoCostoSubtotal(): number {
    return this.calcularMontosPayload(this.nuevoCosto).subtotal;
  }

  calcularNuevoCostoTotal(): number {
    return this.calcularMontosPayload(this.nuevoCosto).total;
  }

  calcularGastos(): number {
    return this.costosFiltrados.reduce(
      (acc, c) => this.costoTieneProveedor(c) ? acc + Number(c.subtotal ?? 0) : acc,
      0
    );
  }

  calcularSubtotal(): number {
    return Number(this.obra?.subtotal_costos ?? 0);
  }

  calcularBeneficioTotal(): number {
    return Number(this.obra?.beneficio_costos ?? 0);
  }

  calcularTotalConBeneficio(): number {
    return Number(this.obra?.total_con_beneficio ?? 0);
  }

  calcularComisionMonto(): number {
    if (!this.tieneComision) return 0;
    return Number(this.obra?.comision_monto ?? 0);
  }

  calcularBeneficioNeto(): number {
    return Number(this.obra?.beneficio_neto ?? 0);
  }

  calcularPresupuestoTotal(): number {
    return Number(this.obra?.presupuesto ?? 0);
  }

  pagarComisionObra() {
    if (!this.obra?.id || this.pagandoComision) return;
    if (!this.tieneComision) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin comisión',
        detail: 'Esta obra no tiene comisión configurada.'
      });
      return;
    }

    if (this.comisionPagada) {
      this.messageService.add({
        severity: 'info',
        summary: 'Comisión ya pagada',
        detail: 'La comisión ya fue registrada como pagada.'
      });
      return;
    }

    const monto = Number(this.obra?.comision_monto ?? 0);
    if (!Number.isFinite(monto) || monto <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comisión inválida',
        detail: 'No hay monto de comisión para registrar.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Registrar el pago de comisión por ${monto.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}?`,
      header: 'Confirmar pago',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Pagar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.pagandoComision = true;
        this.transaccionesService.pagarComision(this.obra.id!).subscribe({
          next: () => {
            this.pagandoComision = false;
            this.comisionPagada = true;
            this.movimientoCreado.emit();
            this.messageService.add({
              severity: 'success',
              summary: 'Comisión pagada',
              detail: 'El pago se registró correctamente.'
            });
          },
          error: (err) => {
            this.pagandoComision = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.extractErrorMessage(err, 'No se pudo registrar el pago de la comisión.')
            });
          }
        });
      }
    });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    const body = error?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return String(body.message);
    if (body?.error) return String(body.error);
    if (body?.detail) return String(body.detail);
    if (error?.message) return String(error.message);
    if (error?.statusText) return String(error.statusText);
    return fallback;
  }

  recargarEstadoComision() {
    if (!this.obra?.id) {
      this.comisionPagada = false;
      return;
    }
    this.transaccionesService.getByObra(this.obra.id).subscribe({
      next: (lista) => {
        this.comisionPagada = (lista || []).some(t =>
          (t.tipo_asociado || '').toString().toUpperCase() === 'COMISION' &&
          Number(t.id_asociado ?? 0) === 0 &&
          (t.tipo_transaccion || '').toString().toUpperCase() === 'PAGO' &&
          (t.activo == null || t.activo === true)
        );
      },
      error: () => {
        this.comisionPagada = false;
      }
    });
  }

  calcularTotalPorEstado(value: string): number {
    return this.costosFiltrados
      .filter(
        (c: any) =>
          (c.estado_pago_value || '').toUpperCase() ===
          (value || '').toUpperCase()
      )
      .reduce((acc: number, c: any) => acc + (c.total ?? 0), 0);
  }

  // *** YA NO SE USARÁ PARA EL PDF (solo cálculo interno)
  getPresupuestoTotal(): number {
    return Math.round(this.calcularPresupuestoTotal());
  }

  proveedoresFilter(id: number): Proveedor | undefined {
    return this.proveedores?.find(
      p => Number(p.id) === Number(id)
    );
  }

  // ----------------------------------------------------------
  // ------------------- EXPORTAR PDF --------------------------
  // ----------------------------------------------------------
  async exportarPDF(modo: 'DETALLADO' | 'MEMORIA' | 'AMBOS' = 'DETALLADO') {
    if (this.exportandoPdf) {
      this.messageService.add({
        severity: 'warn',
        summary: 'PDF en proceso',
        detail: 'Espera a que termine la generacion actual.'
      });
      return;
    }
    this.exportandoPdf = true;
    this.ensurePdfMakeReady();

    const obra = this.obra;
    const cliente = obra.cliente;
    const costos = this.costosFiltrados ?? [];

    const logoDataUrl = await this.obtenerLogoDataUrl();
    const licitacion = String(obra?.id ?? 0).padStart(5, '0');
    const fechaHoy = new Date().toLocaleDateString('es-AR');

    const formatCurrency = (valor: number) =>
      (Number(valor) || 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'});

    const subtotalBase = costos.reduce(
      (acc, c) => acc + Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))),
      0
    );
    const beneficioMonto = costos.reduce((acc, c) => {
      const beneficioAplicado = this.usarBeneficioGlobal && c.tipo_costo !== 'ADICIONAL'
        ? this.beneficioGlobal
        : Number(c.beneficio ?? 0);
      return acc + Number(c.subtotal ?? 0) * (beneficioAplicado / 100);
    }, 0);
    const totalConBeneficio = subtotalBase + beneficioMonto;
    const comisionMonto = this.tieneComision ? totalConBeneficio * (this.comision / 100) : 0;
    // El PDF de cotizacion no debe sumar comisiones al total cotizado.
    const presupuestoTotal = totalConBeneficio;
    const beneficioNeto = beneficioMonto - comisionMonto;
    const condicionesTexto = (this.obra.condiciones_presupuesto || '').trim();
    const observacionesTexto = (this.obra.observaciones_presupuesto || '').trim();

    const memoriaTexto = this.normalizarMemoriaTexto(this.obra.memoria_descriptiva);
    if ((modo === 'MEMORIA' || modo === 'AMBOS') && !memoriaTexto) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta memoria descriptiva',
        detail: 'Completa la memoria descriptiva para exportarla como Global.'
      });
      return;
    }

    const pdfCell = (text: any, extra: any = {}) => ({
      text,
      fontSize: 9,
      vAlign: 'middle',
      ...extra
    });

    const memoriaContenido = modo === 'MEMORIA' || modo === 'AMBOS'
      ? this.convertirMemoriaPdfMake(this.obra.memoria_descriptiva) ?? memoriaTexto
      : null;

    const memoriaCell = typeof memoriaContenido === 'string'
      ? pdfCell(memoriaContenido, { alignment: 'left', fontSize: 10 })
      : memoriaContenido
        ? { ...memoriaContenido, vAlign: 'middle', fontSize: 10 }
        : null;

    const memoriaRow = (modo === 'MEMORIA' || modo === 'AMBOS') && memoriaCell
      ? [
        pdfCell('1.1', { alignment: 'center' }),
        memoriaCell,
        pdfCell('gl', { alignment: 'center' }),
        pdfCell('1', { alignment: 'center' }),
        pdfCell(formatCurrency(presupuestoTotal), { alignment: 'right' })
      ]
      : null;

    const filasCostos = costos.map((c, index) => {
      const subtotalBase = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      const beneficioAplicado = this.usarBeneficioGlobal && c.tipo_costo !== 'ADICIONAL'
        ? this.beneficioGlobal
        : Number(c.beneficio ?? 0);
      const subtotalConBeneficio = subtotalBase * (1 + beneficioAplicado / 100);

      return [
        pdfCell(this.getItemNumeroDisplay(c, index), { alignment: 'center' }),
        pdfCell(this.normalizarDescripcionCosto(c.descripcion) || '-', { alignment: 'left' }),
        pdfCell(c.unidad || '-', { alignment: 'center' }),
        pdfCell(String(c.cantidad ?? 0), { alignment: 'center' }),
        pdfCell(formatCurrency(subtotalConBeneficio), { alignment: 'right' })
      ];
    });
    const filasTabla = modo === 'MEMORIA'
      ? (memoriaRow ? [memoriaRow] : [])
      : (modo === 'AMBOS' && memoriaRow ? [memoriaRow, ...filasCostos] : filasCostos);
    const subtotalMostrar = modo === 'MEMORIA' ? presupuestoTotal : totalConBeneficio;

    const docDefinition: any = {
      pageMargins: [20, 40, 20, 60],
      content: [
        logoDataUrl
          ? { image: logoDataUrl, width: 555, height: 140, alignment: 'center', margin: [0, 0, 0, 14] }
          : { text: '', margin: [0, 0, 0, 14] },

        {
          table: {
            widths: [140, '*'],
            body: [
              [
                pdfCell('Cliente', { bold: true, alignment: 'center' }),
                pdfCell(cliente?.nombre ?? '---', { alignment: 'left' })
              ],
              [
                pdfCell('Obra', { bold: true, alignment: 'center' }),
                pdfCell(obra?.nombre ?? '---', { alignment: 'left' })
              ],
              [
                pdfCell('Direccion', { bold: true, alignment: 'center' }),
                pdfCell(obra?.direccion ?? '-', { alignment: 'left' })
              ],
              [
                pdfCell('Licitacion/Obra', { bold: true, alignment: 'center' }),
                pdfCell(String(obra?.id ?? licitacion), { alignment: 'left' })
              ],
              [
                pdfCell('Fecha', { bold: true, alignment: 'center' }),
                pdfCell(fechaHoy, { alignment: 'left' })
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0
          },
          margin: [-10, 0, 0, 18]
        },

        { text: 'Detalle de costos', style: 'sectionHeader' },
        {
          table: {
            widths: [40, '*', 20, 35, 80],
            headerRows: 1,
            body: [
              [
                pdfCell('ITEM', { bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' }),
                pdfCell('DESCRIPCION', { bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' }),
                pdfCell('UN', { bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' }),
                pdfCell('CANT', { bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' }),
                pdfCell('Subtotal', { bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' })
              ],
              ...filasTabla
            ]
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 12]
        },

        {
          alignment: 'right',
          table: {
            widths: ['*', 180],
            body: [
              [pdfCell('Subtotal', { alignment: 'left' }), pdfCell(formatCurrency(presupuestoTotal), { alignment: 'right' })]
            ]
          },
          layout: {
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 12]
        },

        { text: 'Condiciones y observaciones', style: 'sectionHeader' },
        {
          table: {
            widths: ['*'],
            body: this.buildCondicionesPdfRows(condicionesTexto, observacionesTexto)
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            fillColor: () => '#f8fafc'
          },
          margin: [0, 0, 0, 4]
        }
      ],
      styles: {
        sectionHeader: { fontSize: 11, bold: true, margin: [0, 12, 0, 6] }
      }
    };

    if (!this.obra?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Obra no disponible',
        detail: 'No se puede guardar el PDF sin una obra válida.'
      });
      return;
    }

    const filename = `Presupuesto_${licitacion}.pdf`;
    const modoLabel =
      modo === 'DETALLADO' ? 'Itemizado' : modo === 'MEMORIA' ? 'Global' : 'Mixto';
    const observacion = `Presupuesto ${modoLabel}`;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob(resolve);
        } catch (error) {
          reject(error);
        }
      });

      const file = new File([blob], filename, { type: 'application/pdf' });
      this.documentosService.uploadDocumentoFlexible(
        this.obra.id!,
        'OTRO',
        observacion,
        file
      ).subscribe({
        next: (doc) => {
          const url = this.documentosService.getDocumentoUrl(doc.id_documento!);
          this.documentoCreado.emit();
          const opened = window.open(url, '_blank');
          if (!opened) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Ventana bloqueada',
              detail: 'Habilita los popups para abrir el PDF.'
            });
          }
          this.exportandoPdf = false;
        },
        error: () => {
          this.exportandoPdf = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error al guardar',
            detail: 'No se pudo guardar el PDF en documentos.'
          });
        }
      });
    } catch (error) {
      this.exportandoPdf = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error al generar',
        detail: 'No se pudo generar el PDF.'
      });
    }
  }

  //----------------------------------------------------------
  // Helpers internos
  //----------------------------------------------------------
  private ensurePdfMakeReady() {
    if (this.pdfMakeReady) return;

    const fonts =
      (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

    if (fonts) {
      (pdfMake as any).vfs = fonts;
      this.pdfMakeReady = true;
    }
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
        if (!response.ok) {
          continue;
        }

        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Resultado de logo no es una cadena'));
            }
          };
          reader.onerror = () => reject(new Error('No se pudo leer el logo'));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        // intentamos con el siguiente
      }
    }

    console.error('No se pudo cargar el logo de la cotizaciÇün', {
      intentos: candidates
    });
    return undefined;
  }

  private inicializarCostos() {
    const lista = this.costos.map(c => {
      const normalizado = this.calcularMontosPayload(c);
      const proveedorObj = this.proveedores.find(
        p => Number(p.id) === Number(normalizado.id_proveedor)
      );
      return {
        ...c,
        ...normalizado,
        id_proveedor: c.id_proveedor ?? c.proveedor?.id ?? proveedorObj?.id,
        proveedor: c.proveedor ?? proveedorObj,
        precio_unitario: c.precio_unitario ?? 0,
        beneficio: c.beneficio ?? normalizado.beneficio ?? 0,
        estado_pago: c.estado_pago ?? normalizado.estado_pago,
        enEdicion: false
      };
    });
    this.costosFiltrados = this.ordenarCostos(lista);
  }

  private calcularMontosPayload(costo: Partial<ObraCosto>) {
    const cantidad = Number(costo.cantidad ?? 0);
    const precio = Number(costo.precio_unitario ?? 0);
    const itemNumeroRaw = (costo.item_numero ?? '').toString().trim();

    const subtotal = cantidad * precio;

    const tipoCosto: 'ORIGINAL' | 'ADICIONAL' =
      costo.tipo_costo === 'ADICIONAL' ? 'ADICIONAL' : 'ORIGINAL';

    // EL PDF no usa beneficio ni comision, pero el sistema si.
    const beneficio = tipoCosto === 'ADICIONAL'
      ? Number(costo.beneficio ?? 0)
      : this.usarBeneficioGlobal
        ? this.beneficioGlobal
        : Number(costo.beneficio ?? 0);

    const total = subtotal * (1 + beneficio / 100);

    const idProveedorVal =
      typeof costo.id_proveedor === 'object'
        ? (costo.id_proveedor as any)?.id
        : costo.id_proveedor ?? costo.proveedor?.id;

    return {
      item_numero: itemNumeroRaw || undefined,
      id_proveedor: idProveedorVal != null ? Number(idProveedorVal) : undefined,
      descripcion: this.normalizarDescripcionCosto(costo.descripcion),
      unidad: costo.unidad ?? '',
      cantidad,
      precio_unitario: precio,
      beneficio,
      subtotal,
      total,
      estado_pago: costo.estado_pago ?? 'PENDIENTE',
      tipo_costo: tipoCosto
    };
  }
  private getNuevoCostoBase(): Partial<ObraCosto> {
    return {
      item_numero: '',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      unidad: '',
      id_proveedor: undefined,
      proveedor: undefined,
      beneficio: this.usarBeneficioGlobal ? this.beneficioGlobal : 0,
      estado_pago: 'PENDIENTE',
      tipo_costo: 'ORIGINAL' as const
    };
  }

  filtrarProveedores(event: any) {
    const query = (event?.query || '').toLowerCase();
    const filtrados = (this.proveedores || []).filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const cuit = (p.cuit || '').toString().toLowerCase();
      return nombre.includes(query) || cuit.includes(query);
    });
    this.filteredProveedores = this.appendNuevoProveedorOption(filtrados);
  }

  seleccionarProveedorNuevo(value: any) {
    const seleccionado = typeof value === 'object' ? value : undefined;
    if (Number(seleccionado?.id ?? -1) === this.NUEVO_PROVEEDOR_ID) {
      this.proveedorTarget = 'nuevo';
      this.abrirModalProveedor();
      this.limpiarProveedorNuevo();
      return;
    }
    this.nuevoCostoProveedor = seleccionado ?? null;
    this.nuevoCosto.id_proveedor = seleccionado?.id ?? undefined;
    this.nuevoCosto.proveedor = seleccionado;
  }

  limpiarProveedorNuevo() {
    this.nuevoCostoProveedor = null;
    this.nuevoCosto.id_proveedor = undefined;
    this.nuevoCosto.proveedor = undefined;
    this.filteredProveedores = this.appendNuevoProveedorOption(this.proveedores || []);
  }

  private appendNuevoProveedorOption(list: Proveedor[]): Proveedor[] {
    const safe = list || [];
    return [...safe.filter(p => Number(p.id) !== this.NUEVO_PROVEEDOR_ID), this.nuevoProveedorOption];
  }

  seleccionarProveedorFila(costo: ObraCosto, value: any) {
    const seleccionado = typeof value === 'object' ? value : undefined;
    if (Number(seleccionado?.id ?? -1) === this.NUEVO_PROVEEDOR_ID) {
      costo.proveedor = undefined;
      costo.id_proveedor = undefined;
      this.proveedorTarget = costo;
      this.abrirModalProveedor();
      return;
    }
    costo.proveedor = seleccionado ?? null;
    costo.id_proveedor = seleccionado?.id ?? undefined;
  }

  limpiarProveedorFila(costo: ObraCosto) {
    costo.proveedor = undefined;
    costo.id_proveedor = undefined;
    this.filteredProveedores = this.proveedores || [];
  }

  private cargarEstadosDePago() {
    this.estadoPagoService.getEstadosPago().subscribe({
      next: records => {
        this.estadosPagoRecords = records;
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar estados de pago', err);
        this.loading = false;
      }
    });
  }

  private actualizarEstadoPagoDirecto(
    c: ObraCosto,
    nuevoEstadoName: string
  ) {
    const nuevoEstado = this.estadosPagoRecords.find(
      e => e.name === nuevoEstadoName
    );
    if (!nuevoEstado) return;

    this.costosService.updateEstadoPago(c.id!, nuevoEstadoName).subscribe({
      next: () => {
        c.estado_pago = nuevoEstado.name;

        const index = this.costos.findIndex(
          costo => costo.id === c.id
        );
        if (index !== -1) {
          this.costos[index] = {
            ...this.costos[index],
            estado_pago: nuevoEstado.name
          };
        }

        this.costosActualizados.emit([...this.costos]);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El costo fue marcado como "${nuevoEstado.label}"`
        });
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(
            err,
            'No se pudo actualizar el estado de pago'
          )
        });
      }
    });
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;

    const detalle = err.error;
    if (typeof detalle === 'string' && detalle.trim()) {
      return detalle;
    }

    if (detalle) {
      return (
        detalle.error ||
        detalle.mensaje ||
        detalle.message ||
        detalle.detail ||
        fallback
      );
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }
    return fallback;
  }

  esAdicional(costo?: ObraCosto | null): boolean {
    if (!costo) return false;
    const raw =
      (costo as any)?.tipo_costo ??
      (costo as any)?.tipoCosto ??
      (costo as any)?.tipo?.nombre ??
      (costo as any)?.tipo?.name ??
      '';
    return raw.toString().toUpperCase() === 'ADICIONAL';
  }

  private costoTieneProveedor(costo: Partial<ObraCosto>): boolean {
    const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
    return id > 0;
  }

  getTipoCostoOptions() {
    if (!this.estaSelladaCotizacion()) return this.tipoCostoOptions;
    return this.tipoCostoOptions.filter(o => o.value === 'ADICIONAL');
  }

  puedeEditarCosto(costo?: ObraCosto | null): boolean {
    if (!costo) return false;
    return !this.estaSelladaCotizacion() || this.esAdicional(costo);
  }

  getItemNumeroDisplay(costo: ObraCosto, index: number): string {
    const itemNumero = (costo?.item_numero ?? '').toString().trim();
    return itemNumero || String(index + 1);
  }

  private ordenarCostos(lista: ObraCosto[]): ObraCosto[] {
    return [...lista].sort((a, b) => {
      const aAdd = (a.tipo_costo || 'ORIGINAL') === 'ADICIONAL';
      const bAdd = (b.tipo_costo || 'ORIGINAL') === 'ADICIONAL';
      if (aAdd !== bAdd) return aAdd ? 1 : -1;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }

  estaSelladaCotizacion(): boolean {
    const estado = this.normalizarEstadoObra(this.obra?.obra_estado);
    return estado === 'EN_PROGRESO';
  }

  permiteBeneficioGlobal(): boolean {
    const estado = this.normalizarEstadoObra(this.obra?.obra_estado);
    return !['ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA'].includes(estado);
  }

  private normalizarEstadoObra(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string') {
      return raw.trim().toUpperCase().replace(/\s+/g, '_');
    }
    const value = raw?.name ?? raw?.label ?? '';
    return value.toString().trim().toUpperCase().replace(/\s+/g, '_');
  }

  private ajustarTipoCostoNuevoSegunEstado() {
    if (!this.estaSelladaCotizacion()) return;
    if (this.nuevoCosto.tipo_costo !== 'ADICIONAL') {
      this.nuevoCosto.tipo_costo = 'ADICIONAL';
      this.onTipoCostoNuevoChange('ADICIONAL');
    }
  }

  private normalizarMemoriaTexto(raw?: string | null): string | null {
    const texto = this.htmlToPlainWithBullets(raw);
    return texto || null;
  }

  private normalizarDescripcionCosto(raw?: string | null): string {
    return this.htmlToPlainWithBullets(raw);
  }

  private htmlToPlainWithBullets(raw?: string | null): string {
    if (!raw) return '';
    if (!raw.includes('<')) {
      return raw.toString().replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');
    const lines: string[] = [];

    const pushLine = (text: string) => {
      const cleaned = text.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/[ \t]+/g, ' ').trim();
      if (cleaned) lines.push(cleaned);
    };

    const inlineText = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (tag === 'br') return '\n';
      return Array.from(element.childNodes).map(child => inlineText(child)).join('');
    };

    const walk = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        pushLine(node.textContent || '');
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(element.children).filter(el => el.tagName.toLowerCase() === 'li');
        items.forEach((li, idx) => {
          const text = inlineText(li).replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
          if (!text) return;
          const prefix = tag === 'ol' ? `${idx + 1}. ` : '• ';
          lines.push(`${prefix}${text}`);
        });
        return;
      }

      if (tag === 'p' || tag === 'div') {
        const text = inlineText(element);
        pushLine(text);
        return;
      }

      Array.from(element.childNodes).forEach(child => walk(child));
    };

    Array.from(doc.body.childNodes).forEach(node => walk(node));
    return lines.join('\n').trim();
  }

  private convertirMemoriaPdfMake(raw?: string | null): any | null {
    if (!raw) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');
    const blocks: any[] = [];
    doc.body.childNodes.forEach(node => {
      const block = this.convertirBloqueHtml(node);
      if (block) {
        blocks.push(block);
      }
    });
    if (!blocks.length) return null;
    return { stack: blocks };
  }

  private convertirBloqueHtml(node: ChildNode): any | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      return text ? { text, fontSize: 9, margin: [0, 0, 0, 4] } : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === 'ul' || tag === 'ol') {
      const items: any[] = [];
      element.childNodes.forEach(child => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        const li = child as HTMLElement;
        if (li.tagName.toLowerCase() !== 'li') return;
        const runs = this.convertirInlineHtml(li);
        if (runs.length) {
          items.push({ text: runs, fontSize: 9 });
        }
      });
      return items.length ? (tag === 'ul' ? { ul: items } : { ol: items }) : null;
    }

    const runs = this.convertirInlineHtml(element);
    if (!runs.length) return null;
    return { text: runs, fontSize: 9, margin: [0, 0, 0, 4] };
  }

  private convertirInlineHtml(node: ChildNode, style: any = {}): any[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      return text ? [{ text, ...style }] : [];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const nextStyle = { ...style };

    if (tag === 'b' || tag === 'strong') {
      nextStyle.bold = true;
    } else if (tag === 'i' || tag === 'em') {
      nextStyle.italics = true;
    } else if (tag === 'u') {
      nextStyle.decoration = 'underline';
    } else if (tag === 'br') {
      return [{ text: '\n', ...style }];
    }

    const runs: any[] = [];
    element.childNodes.forEach(child => {
      runs.push(...this.convertirInlineHtml(child, nextStyle));
    });
    return runs;
  }

  private buildCondicionesPdfRows(condicionesTexto: string, observacionesTexto: string): any[] {
    const condicionesDefault = [
      'Validez de oferta: 7 dias corridos.',
      'Forma de pago: Al finalizar las tareas.'
    ];
    const condiciones = this.normalizarLineas(condicionesTexto);
    const observaciones = this.normalizarLineas(observacionesTexto);

    const rows: any[] = [];
    (condiciones.length ? condiciones : condicionesDefault).forEach(texto => {
      rows.push([{ text: texto, fontSize: 10, margin: [6, 6, 6, 6] }]);
    });

    if (observaciones.length) {
      rows.push([{ text: 'Observaciones:', fontSize: 10, bold: true, margin: [6, 8, 6, 4] }]);
      observaciones.forEach(texto => {
        rows.push([{ text: texto, fontSize: 10, margin: [6, 4, 6, 6] }]);
      });
    }

    return rows.length ? rows : [[{ text: 'Sin condiciones registradas.', fontSize: 10, margin: [6, 6, 6, 6] }]];
  }

  normalizarLineas(texto?: string | null): string[] {
    return (texto || '')
      .split(/\r?\n/)
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);
  }

  getCondicionesLineas(): string[] {
    return this.normalizarLineas(this.obra?.condiciones_presupuesto);
  }

  getObservacionesLineas(): string[] {
    return this.normalizarLineas(this.obra?.observaciones_presupuesto);
  }

  stripDescripcion(raw?: string | null): string {
    if (!raw) return '';
    return raw.replace(/<[^>]*>/g, '').trim();
  }

  toggleMemoria() {
    this.memoriaExpandida = !this.memoriaExpandida;
    this.scheduleMemoriaOverflowCheck();
  }

  iniciarEdicionMemoria() {
    this.memoriaDraft = this.obra?.memoria_descriptiva ?? '';
    this.memoriaEditando = true;
    this.memoriaExpandida = true;
    this.memoriaOverflow = false;
  }

  cancelarEdicionMemoria() {
    this.memoriaEditando = false;
    this.memoriaDraft = '';
    this.scheduleMemoriaOverflowCheck();
  }

  guardarMemoriaDescriptiva() {
    if (!this.obra?.id || this.guardandoMemoria) return;
    this.guardandoMemoria = true;
    const payload: any = {
      id: this.obra.id,
      id_cliente: this.obra.id_cliente ?? this.obra.cliente?.id,
      obra_estado: this.obra.obra_estado,
      nombre: this.obra.nombre,
      direccion: this.obra.direccion,
      fecha_inicio: this.obra.fecha_inicio,
      fecha_presupuesto: this.obra.fecha_presupuesto,
      fecha_fin: this.obra.fecha_fin,
      fecha_adjudicada: this.obra.fecha_adjudicada,
      fecha_perdida: this.obra.fecha_perdida,
      tiene_comision: this.obra.tiene_comision ?? false,
      presupuesto: this.obra.presupuesto,
      beneficio_global: this.obra.beneficio_global,
      beneficio: this.obra.beneficio,
      comision: this.obra.comision,
      notas: this.obra.notas,
      memoria_descriptiva: this.memoriaDraft,
      condiciones_presupuesto: this.obra.condiciones_presupuesto,
      observaciones_presupuesto: this.obra.observaciones_presupuesto,
      requiere_factura: this.obra.requiere_factura
    };
    Object.keys(payload).forEach(
      key => payload[key] === undefined && delete payload[key]
    );

    this.obrasService.updateObra(this.obra.id, payload).subscribe({
      next: (updated) => {
        this.obra = { ...this.obra, memoria_descriptiva: updated?.memoria_descriptiva ?? this.memoriaDraft };
        this.memoriaEditando = false;
        this.guardandoMemoria = false;
        this.scheduleMemoriaOverflowCheck();
        this.messageService.add({
          severity: 'success',
          summary: 'Memoria actualizada',
          detail: 'Se guardaron los cambios.'
        });
      },
      error: () => {
        this.guardandoMemoria = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la memoria descriptiva.'
        });
      }
    });
  }

  iniciarEdicionCondiciones() {
    const actuales = (this.obra?.condiciones_presupuesto ?? '').trim();
    this.condicionesDraft = actuales || this.condicionesDefaultTexto;
    this.observacionesDraft = this.obra?.observaciones_presupuesto ?? '';
    this.condicionesEditando = true;
  }

  cancelarEdicionCondiciones() {
    this.condicionesEditando = false;
    this.condicionesDraft = '';
    this.observacionesDraft = '';
  }

  guardarCondicionesPresupuesto() {
    if (!this.obra?.id || this.guardandoCondiciones) return;
    this.guardandoCondiciones = true;
    const payload: any = {
      id: this.obra.id,
      id_cliente: this.obra.id_cliente ?? this.obra.cliente?.id,
      obra_estado: this.obra.obra_estado,
      nombre: this.obra.nombre,
      direccion: this.obra.direccion,
      fecha_inicio: this.obra.fecha_inicio,
      fecha_presupuesto: this.obra.fecha_presupuesto,
      fecha_fin: this.obra.fecha_fin,
      fecha_adjudicada: this.obra.fecha_adjudicada,
      fecha_perdida: this.obra.fecha_perdida,
      tiene_comision: this.obra.tiene_comision ?? false,
      presupuesto: this.obra.presupuesto,
      beneficio_global: this.obra.beneficio_global,
      beneficio: this.obra.beneficio,
      comision: this.obra.comision,
      notas: this.obra.notas,
      memoria_descriptiva: this.obra.memoria_descriptiva,
      condiciones_presupuesto: this.condicionesDraft,
      observaciones_presupuesto: this.observacionesDraft,
      requiere_factura: this.obra.requiere_factura
    };
    Object.keys(payload).forEach(
      key => payload[key] === undefined && delete payload[key]
    );

    this.obrasService.updateObra(this.obra.id, payload).subscribe({
      next: (updated) => {
        this.obra = {
          ...this.obra,
          condiciones_presupuesto: updated?.condiciones_presupuesto ?? this.condicionesDraft,
          observaciones_presupuesto: updated?.observaciones_presupuesto ?? this.observacionesDraft
        };
        this.condicionesEditando = false;
        this.guardandoCondiciones = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Condiciones actualizadas',
          detail: 'Se guardaron los cambios.'
        });
      },
      error: () => {
        this.guardandoCondiciones = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar las condiciones.'
        });
      }
    });
  }

  private scheduleMemoriaOverflowCheck() {
    setTimeout(() => this.checkMemoriaOverflow(), 0);
  }

  private checkMemoriaOverflow() {
    if (!this.memoriaBody) {
      this.memoriaOverflow = false;
      return;
    }
    const el = this.memoriaBody.nativeElement;
    this.memoriaOverflow = el.scrollHeight > el.clientHeight + 2;
  }
}










