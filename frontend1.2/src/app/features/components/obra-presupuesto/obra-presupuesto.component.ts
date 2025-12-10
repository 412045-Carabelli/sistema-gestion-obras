import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  EstadoPago,
  Obra,
  ObraCosto,
  Proveedor,
  Transaccion
} from '../../../core/models/models';
import { EstadoPagoService } from '../../../services/estado-pago/estado-pago.service';
import { CostosService } from '../../../services/costos/costos.service';
import { Select } from 'primeng/select';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { TransaccionesService } from '../../../services/transacciones/transacciones.service';

// PDFMAKE
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

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
    FormsModule,
    ToastModule,
    NgClass,
    Select,
    ModalComponent
  ],
  providers: [MessageService],
  templateUrl: './obra-presupuesto.component.html'
})
export class ObraPresupuestoComponent implements OnInit, OnChanges {
  @Input() obra!: Obra;

  @Input() proveedores: Proveedor[] = [];
  @Input() costos: ObraCosto[] = [];

  @Input() usarBeneficioGlobal = false;
  @Input() beneficioGlobal = 0;
  @Input() tieneComision = false;
  @Input() comision = 0;

  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();
  @Output() movimientoCreado = new EventEmitter<void>();

  costosFiltrados: ObraCosto[] = [];
  estadosPagoRecords: { label: string; name: string }[] = [];
  loading = true;
  nuevoCosto: Partial<ObraCosto> = this.getNuevoCostoBase();
  private pdfMakeReady = false;

  modalPagoVisible = false;
  costoPendientePago: ObraCosto | null = null;
  estadoPendientePago: string | null = null;
  transaccionForm: Partial<Transaccion> = {};
  errorApi?: string;

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService,
    private transaccionesService: TransaccionesService
  ) {}

  ngOnInit() {
    if (this.costos?.length > 0) {
      this.inicializarCostos();
    }
    this.cargarEstadosDePago();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costos'] && this.costos?.length > 0) {
      this.inicializarCostos();
    }
    if (changes['beneficioGlobal'] || changes['tieneComision']) {
      this.costosFiltrados = this.costosFiltrados.map(c => ({ ...c }));
      this.costosFiltrados.forEach(c => this.recalcularEnEdicion(c));
    }
  }

  actualizarEstadoPago(c: ObraCosto, nuevoEstadoName: string) {
    if (
      (c.estado_pago === 'PAGADO' || c.estado_pago === 'PARCIAL') &&
      nuevoEstadoName === 'PENDIENTE'
    ) {
      this.transaccionesService.deleteByCosto(c.id!).subscribe({
        next: () => this.actualizarEstadoPagoDirecto(c, nuevoEstadoName),
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.getErrorMessage(
              err,
              'No se pudo eliminar el movimiento asociado'
            )
          });
        }
      });
      return;
    }

    const requiereMovimiento =
      nuevoEstadoName === 'PAGADO' || nuevoEstadoName === 'PARCIAL';

    if (requiereMovimiento) {
      const forma =
        nuevoEstadoName === 'PAGADO'
          ? 'TOTAL'
          : nuevoEstadoName === 'PARCIAL'
            ? 'PARCIAL'
            : 'TOTAL';

      this.costoPendientePago = c;
      this.estadoPendientePago = nuevoEstadoName;
      this.errorApi = undefined;

      this.transaccionForm = {
        id_obra: this.obra.id!,
        id_asociado: c.id_proveedor,
        tipo_asociado: 'PROVEEDOR',
        tipo_transaccion: 'PAGO',
        tipo_movimiento: 'PAGO',
        monto: c.total ?? 0,
        forma_pago: forma,
        medio_pago: 'Transferencia',
        fecha: new Date().toISOString().slice(0, 10),
        observacion: ''
      } as any;

      this.modalPagoVisible = true;
      return;
    }

    this.actualizarEstadoPagoDirecto(c, nuevoEstadoName);
  }

  agregarCosto() {
    if (!this.nuevoCosto.descripcion || !this.nuevoCosto.id_proveedor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa proveedor y descripción para agregar el costo.'
      });
      return;
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
          this.costosFiltrados = [...this.costosFiltrados, actualizado];
          this.costosActualizados.emit(this.costosFiltrados);
          this.nuevoCosto = this.getNuevoCostoBase();
          this.messageService.add({
            severity: 'success',
            summary: 'Costo agregado',
            detail: 'Se agregó un nuevo costo a la matriz.'
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
    costo.enEdicion = true;
  }

  recalcularEnEdicion(costo: any) {
    const { subtotal, total } = this.calcularMontosPayload(costo);
    costo.subtotal = subtotal;
    costo.total = total;
  }

  guardarEdicion(costo: any) {
    const payload = this.calcularMontosPayload(costo);
    this.costosService.updateCosto(costo.id, payload).subscribe({
      next: actualizado => {
        Object.assign(costo, actualizado, payload, { enEdicion: false });
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

  eliminarCosto(costo: any) {
    if (!costo.id) return;
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

  confirmarPago() {
    if (!this.costoPendientePago || !this.estadoPendientePago) {
      this.modalPagoVisible = false;
      return;
    }

    const formaPago = (
      this.transaccionForm.forma_pago ??
      (this.estadoPendientePago === 'PAGADO'
        ? 'TOTAL'
        : this.estadoPendientePago === 'PARCIAL'
          ? 'PARCIAL'
          : 'TOTAL')
    )
      .toString()
      .toUpperCase();

    const montoCosto = Number(this.costoPendientePago.total ?? 0);
    const montoIngresado = Number(
      this.transaccionForm.monto ??
      this.costoPendientePago.total ??
      0
    );

    const payload: any = {
      id_obra: this.obra.id!,
      id_asociado: this.costoPendientePago.id_proveedor,
      tipo_asociado: 'PROVEEDOR',
      tipo_transaccion: this.transaccionForm.tipo_transaccion || 'PAGO',
      tipo_movimiento: this.transaccionForm.tipo_movimiento || 'PAGO',
      monto: montoIngresado,
      forma_pago: formaPago,
      medio_pago: this.transaccionForm.medio_pago ?? 'Transferencia',
      fecha: this.transaccionForm.fecha ?? new Date().toISOString(),
      observacion: this.transaccionForm.observacion ?? '',
      id_costo: this.costoPendientePago.id
    };

    this.errorApi = undefined;

    this.transaccionesService.create(payload as any).subscribe({
      next: () => {
        this.modalPagoVisible = false;
        this.actualizarEstadoPagoDirecto(
          this.costoPendientePago!,
          this.estadoPendientePago!
        );
        this.costoPendientePago = null;
        this.estadoPendientePago = null;
        this.movimientoCreado.emit();
      },
      error: err => {
        this.errorApi = this.getErrorMessage(
          err,
          'No se pudo registrar la transaccion'
        );
      }
    });
  }

  cancelarPago() {
    this.modalPagoVisible = false;
    this.costoPendientePago = null;
    this.estadoPendientePago = null;
  }

  calcularTotal(): number {
    return this.costosFiltrados.reduce(
      (acc, c) => acc + (c.total ?? 0),
      0
    );
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

  // *** YA NO SE USARÃ PARA EL PDF (solo cÃ¡lculo interno)
  getPresupuestoTotal(): number {
    const base = this.calcularTotal();
    const comisionMonto = this.tieneComision ? base * (this.comision / 100) : 0;
    return Math.round(base + comisionMonto);
  }

  proveedoresFilter(id: number): Proveedor | undefined {
    return this.proveedores?.find(
      p => Number(p.id) === Number(id)
    );
  }

  // ----------------------------------------------------------
  // ------------------- EXPORTAR PDF --------------------------
  // ----------------------------------------------------------
  async exportarPDF() {
    this.ensurePdfMakeReady();

    const obra = this.obra;
    const cliente = obra.cliente;

    const costos = this.costosFiltrados ?? [];

    // Logo desde assets
    const logoDataUrl = await this.obtenerLogoDataUrl();

    // LicitaciÃ³n = id con ceros adelante
    const licitacion = String(obra?.id ?? 0).padStart(5, '0');

    const fechaHoy = new Date().toLocaleDateString('es-AR');

    // Tabla de costos
    const filasCostos = costos.map(c => {
      return [
        { text: c.descripcion, fontSize: 9 },
        { text: c.unidad || '-', fontSize: 9, alignment: 'center' },
        { text: String(c.cantidad ?? 0), fontSize: 9, alignment: 'center' },
        {
          text: (c.subtotal ?? 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }),
          fontSize: 9,
          alignment: 'right'
        }
      ];
    });

    // Subtotal real SIN comisiÃ³n ni beneficio
    const subtotal = costos.reduce(
      (acc, c) => acc + (c.subtotal ?? 0),
      0
    );

    const docDefinition: any = {
      pageMargins: [20, 20, 20, 20],

      content: [
        // Encabezado: solo logo ocupando el ancho
        logoDataUrl
          ? {
              image: logoDataUrl,
              width: 620,
              alignment: 'center',
              margin: [0, 0, 0, 12]
            }
          : { text: '', margin: [0, 0, 0, 12] },

        { text: '\n\nCOTIZACIÓN', fontSize: 16, bold: true, alignment: 'center' },
        { text: '\n' },

        // DATOS CLIENTE + OBRA
        {
          columns: [
            [
              { text: 'Cliente', bold: true },
              { text: cliente?.nombre ?? '---' },
              { text: `CUIT: ${cliente?.cuit ?? '-'}`, fontSize: 9 },
              {
                text: `Condición IVA: ${cliente?.condicion_iva ?? '-'}`,
                fontSize: 9
              },
              { text: `Tel: ${cliente?.telefono ?? '-'}`, fontSize: 9 },
              { text: `Email: ${cliente?.email ?? '-'}`, fontSize: 9 }
            ],
            [
              { text: 'Obra', bold: true },
              { text: obra?.nombre ?? '---' },
              { text: obra?.direccion ?? '', fontSize: 9 },
              {
                text: `Licitación/Obra: ${licitacion}`,
                fontSize: 10,
                margin: [0, 5, 0, 0]
              }
            ],
            [
              { text: 'Fecha', bold: true },
              { text: fechaHoy }
            ]
          ]
        },

        { text: '\n\n' },

        // TABLA
        {
          table: {
            widths: ['*', 50, 50, 70],
            body: [
              [
                { text: 'DESCRIPCIÓN', bold: true },
                { text: 'UNI.', bold: true, alignment: 'center' },
                { text: 'CANT.', bold: true, alignment: 'center' },
                { text: 'Subtotal', bold: true, alignment: 'right' }
              ],
              ...filasCostos
            ]
          }
        },

        { text: '\n' },

        // TOTALES (SIN mostrar comisiones internas)
        {
          alignment: 'right',
          table: {
            widths: ['*', 120],
            body: [
              [
                'Subtotal',
                subtotal.toLocaleString('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                })
              ],
              [
                'Presupuesto Total',
                subtotal.toLocaleString('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                })
              ]
            ]
          },
          layout: 'noBorders'
        },

        { text: '\n\n' },

        // CONDICIONES
        { text: 'Validez de oferta', bold: true },
        {
          text:
            'El presente presupuesto tiene una validez de 7 días a partir de la fecha.\n',
          fontSize: 10
        },

        { text: 'Plazos de obra', bold: true },
        { text: '7 días hábiles.\n', fontSize: 10 },

        { text: 'Forma de pago', bold: true },
        {
          text:
            'Al finalizar las tareas.\n',
          fontSize: 10
        },

        { text: 'Observaciones', bold: true },
        {
          text: this.obra.notas ?? '-',
          fontSize: 10
        }
      ]
    };

    pdfMake
      .createPdf(docDefinition)
      .download(`COTIZACIÓN_${licitacion}.pdf`);
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

    console.error('No se pudo cargar el logo de la cotizaciÃ‡Ã¼n', {
      intentos: candidates
    });
    return undefined;
  }

  private inicializarCostos() {
    this.costosFiltrados = this.costos.map(c => ({
      ...c,
      id_proveedor: c.id_proveedor ?? c.proveedor?.id,
      precio_unitario: c.precio_unitario ?? 0,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      beneficio: c.beneficio ?? 0,
      estado_pago: c.estado_pago,
      enEdicion: false
    }));
  }

  private calcularMontosPayload(costo: Partial<ObraCosto>) {
    const cantidad = Number(costo.cantidad ?? 0);
    const precio = Number(costo.precio_unitario ?? 0);

    const subtotal = cantidad * precio;

    // EL PDF no usa beneficio ni comisiÃ³n, pero el sistema sÃ­.
    const beneficio = this.usarBeneficioGlobal
      ? this.beneficioGlobal
      : Number(costo.beneficio ?? 0);

    const total =
      subtotal * (1 + beneficio / 100);

    return {
      id_proveedor: Number(costo.id_proveedor),
      descripcion: costo.descripcion ?? '',
      unidad: costo.unidad ?? '',
      cantidad,
      precio_unitario: precio,
      beneficio,
      subtotal,
      total,
      estado_pago: costo.estado_pago ?? 'PENDIENTE'
    };
  }

  private getNuevoCostoBase(): Partial<ObraCosto> {
    return {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      unidad: '',
      id_proveedor: undefined,
      beneficio: this.usarBeneficioGlobal ? this.beneficioGlobal : 0,
      estado_pago: 'PENDIENTE'
    };
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
}




