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
    ConfirmDialog
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

  costosFiltrados: ObraCosto[] = [];
  estadosPagoRecords: { label: string; name: string }[] = [];
  loading = true;
  nuevoCosto: Partial<ObraCosto> = this.getNuevoCostoBase();
  nuevoCostoProveedor?: Proveedor | null;
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

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService,
    private obrasService: ObrasService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.filteredProveedores = this.proveedores || [];
    this.nuevoCostoProveedor = undefined;
    if (this.costos?.length > 0) {
      this.inicializarCostos();
    }
    this.cargarEstadosDePago();
    this.ajustarTipoCostoNuevoSegunEstado();
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
    }
    if (changes['beneficioGlobal'] || changes['tieneComision']) {
      this.costosFiltrados = this.costosFiltrados.map(c => ({ ...c }));
      this.costosFiltrados.forEach(c => this.recalcularEnEdicion(c));
      if (this.usarBeneficioGlobal && this.nuevoCosto.tipo_costo !== 'ADICIONAL') {
        this.nuevoCosto.beneficio = this.beneficioGlobal;
      }
    }
    if (changes['proveedores']) {
      this.filteredProveedores = this.proveedores || [];
    }
  }

  actualizarEstadoPago(c: ObraCosto, nuevoEstadoName: string) {
    this.actualizarEstadoPagoDirecto(c, nuevoEstadoName);
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

  abrirDetalleCosto(costo: ObraCosto) {
    if (!costo) return;
    this.costoDetalle = costo;
    this.costoDetalleDraft = {
      ...costo,
      proveedor: costo.proveedor ?? this.proveedores.find(p => Number(p.id) === Number(costo.id_proveedor))
    };
    this.costoDetalleEditando = false;
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
      (acc, c) => acc + Number(c.subtotal ?? 0),
      0
    );
  }

  calcularSubtotal(): number {
    return this.costosFiltrados.reduce(
      (acc, c) => acc + Number(c.subtotal ?? 0),
      0
    );
  }

  calcularBeneficioTotal(): number {
    return this.costosFiltrados.reduce((acc, c) => {
      const subtotal = Number(c.subtotal ?? 0);
      const total = Number(c.total ?? subtotal);
      return acc + (total - subtotal);
    }, 0);
  }

  calcularTotalConBeneficio(): number {
    return this.costosFiltrados.reduce(
      (acc, c) => acc + Number(c.total ?? 0),
      0
    );
  }

  calcularComisionMonto(): number {
    if (!this.tieneComision) return 0;
    return this.calcularTotalConBeneficio() * (this.comision / 100);
  }

  calcularBeneficioNeto(): number {
    return this.calcularBeneficioTotal() - this.calcularComisionMonto();
  }

  calcularPresupuestoTotal(): number {
    return this.calcularTotalConBeneficio() + this.calcularComisionMonto();
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
    const presupuestoTotal = totalConBeneficio + comisionMonto;
    const beneficioNeto = beneficioMonto - comisionMonto;
    const observaciones = (this.obra.notas || '').trim() || 'Sin observaciones adicionales.';

    const memoriaTexto = this.normalizarMemoriaTexto(this.obra.memoria_descriptiva);
    if ((modo === 'MEMORIA' || modo === 'AMBOS') && !memoriaTexto) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta memoria descriptiva',
        detail: 'Completa la memoria descriptiva para exportarla como Global.'
      });
      return;
    }

    const memoriaContenido = modo === 'MEMORIA' || modo === 'AMBOS'
      ? this.convertirMemoriaPdfMake(this.obra.memoria_descriptiva) ?? memoriaTexto
      : null;

    const memoriaRow = (modo === 'MEMORIA' || modo === 'AMBOS') && memoriaContenido
      ? [
        { text: '1.1', fontSize: 9, alignment: 'center' },
        memoriaContenido,
        { text: 'gl', fontSize: 9, alignment: 'center' },
        { text: '1', fontSize: 9, alignment: 'center' },
        { text: formatCurrency(presupuestoTotal), fontSize: 9, alignment: 'right' }
      ]
      : null;

    const filasCostos = costos.map((c, index) => {
      const subtotalBase = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      const beneficioAplicado = this.usarBeneficioGlobal && c.tipo_costo !== 'ADICIONAL'
        ? this.beneficioGlobal
        : Number(c.beneficio ?? 0);
      const subtotalConBeneficio = subtotalBase * (1 + beneficioAplicado / 100);

      return [
        { text: this.getItemNumeroDisplay(c, index), fontSize: 9, alignment: 'center' },
        { text: c.descripcion || '-', fontSize: 9 },
        { text: c.unidad || '-', fontSize: 9, alignment: 'center' },
        { text: String(c.cantidad ?? 0), fontSize: 9, alignment: 'center' },
        { text: formatCurrency(subtotalConBeneficio), fontSize: 9, alignment: 'right' }
      ];
    });
    const filasTabla = modo === 'MEMORIA'
      ? (memoriaRow ? [memoriaRow] : [])
      : (modo === 'AMBOS' && memoriaRow ? [memoriaRow, ...filasCostos] : filasCostos);
    const subtotalMostrar = modo === 'MEMORIA' ? presupuestoTotal : totalConBeneficio;

    const docDefinition: any = {
      pageMargins: [40, 70, 40, 60],
      content: [
        logoDataUrl
          ? { image: logoDataUrl, width: 520, alignment: 'center', margin: [0, 0, 0, 16] }
          : { text: '', margin: [0, 0, 0, 16] },

        {
          table: {
            widths: ['*', '*', 120],
            body: [[
              {
                stack: [
                  { text: 'Cliente', bold: true, margin: [0, 0, 0, 4] },
                  { text: cliente?.nombre ?? '---', margin: [0, 0, 0, 8] },
                  { text: `Tel: ${cliente?.telefono ?? '-'}`, fontSize: 9 }
                ]
              },
              {
                stack: [
                  { text: 'Obra', bold: true, margin: [0, 0, 0, 4] },
                  { text: obra?.nombre ?? '---', margin: [0, 0, 0, 4] },
                  { text: obra?.direccion ?? '-', fontSize: 9, margin: [0, 0, 0, 4] },
                  { text: `Licitacion/Obra: ${licitacion}`, fontSize: 9 }
                ]
              },
              {
                stack: [
                  { text: 'Fecha', bold: true, alignment: 'right', margin: [0, 0, 0, 4] },
                  { text: fechaHoy, alignment: 'right' }
                ]
              }
            ]]
          },
          layout: {
            fillColor: () => '#f8fafc',
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 18]
        },

        { text: 'Detalle de costos', style: 'sectionHeader' },
        {
          table: {
            widths: [40, '*', 20, 35, 80],
            headerRows: 1,
            body: [
              [
                { text: 'ITEM', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'DESCRIPCION', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'UN', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'CANT', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'Subtotal', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f3f4f6' }
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
              ['Subtotal', formatCurrency(presupuestoTotal)]
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
          columns: [
            {
              width: '50%',
              table: {
                widths: ['*'],
                body: [
                  [{ text: 'Validez de oferta: 7 dias corridos.', fontSize: 10, margin: [6, 6, 6, 6] }],
                  [{ text: 'Forma de pago: Al finalizar las tareas.', fontSize: 10, margin: [6, 6, 6, 6] }]
                ]
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                fillColor: () => '#f8fafc'
              }
            },
            {
              width: '50%',
              table: {
                widths: ['*'],
                body: [[
                  {
                    text: observaciones,
                    fontSize: 10,
                    margin: [8, 8, 8, 8]
                  }
                ]]
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                fillColor: () => '#eef2ff'
              }
            }
          ],
          columnGap: 12,
          margin: [0, 0, 0, 4]
        }
      ],
      styles: {
        sectionHeader: { fontSize: 11, bold: true, margin: [0, 12, 0, 6] }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Presupuesto_${licitacion}.pdf`);
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
      descripcion: costo.descripcion ?? '',
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
    this.filteredProveedores = (this.proveedores || []).filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const cuit = (p.cuit || '').toString().toLowerCase();
      return nombre.includes(query) || cuit.includes(query);
    });
  }

  seleccionarProveedorNuevo(value: any) {
    const seleccionado = typeof value === 'object' ? value : undefined;
    this.nuevoCostoProveedor = seleccionado ?? null;
    this.nuevoCosto.id_proveedor = seleccionado?.id ?? undefined;
    this.nuevoCosto.proveedor = seleccionado;
  }

  limpiarProveedorNuevo() {
    this.nuevoCostoProveedor = null;
    this.nuevoCosto.id_proveedor = undefined;
    this.nuevoCosto.proveedor = undefined;
    this.filteredProveedores = this.proveedores || [];
  }

  seleccionarProveedorFila(costo: ObraCosto, value: any) {
    const seleccionado = typeof value === 'object' ? value : undefined;
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

  esAdicional(costo: ObraCosto): boolean {
    return (costo?.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
  }

  getTipoCostoOptions() {
    if (!this.estaSelladaCotizacion()) return this.tipoCostoOptions;
    return this.tipoCostoOptions.filter(o => o.value === 'ADICIONAL');
  }

  puedeEditarCosto(costo: ObraCosto): boolean {
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
    if (!raw) return null;
    const div = document.createElement('div');
    div.innerHTML = raw;
    const texto = (div.innerText || '').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
    return texto || null;
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
      memoria_descriptiva: this.memoriaDraft
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










