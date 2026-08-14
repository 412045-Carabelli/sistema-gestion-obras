import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {forkJoin, of, Subscription, switchMap, finalize, timeout} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {InputNumber} from 'primeng/inputnumber';
import {EditorModule} from 'primeng/editor';
import {FileUploadModule} from 'primeng/fileupload';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';

import {Cliente, Factura, Obra, Transaccion} from '../../../core/models/models';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';

type FacturaModalMode = 'crear' | 'detalle';
type FacturaModalViewMode = 'crear' | 'detalle' | 'editar';

@Component({
  selector: 'app-factura-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    Select,
    DatePicker,
    InputNumber,
    EditorModule,
    FileUploadModule,
    ConfirmDialog,
    CurrencyPipe,
    DatePipe
  ],
  providers: [ConfirmationService],
  templateUrl: './factura-modal.component.html'
})
export class FacturaModalComponent implements OnChanges, OnDestroy {
  private readonly ESTADOS_PERMITIDOS = [
    'ADJUDICADA',
    'EN_PROGRESO',
    'FINALIZADA',
    'COBRADA',
    'FACTURADA',
    'FACTURADA_PARCIAL',
    'FACTURADA_TOTAL'
  ];

  @Input() visible = false;
  @Input() mode: FacturaModalMode = 'crear';
  @Input() facturaId: number | null = null;
  @Input() obraIdPreseleccionado: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() guardada = new EventEmitter<Factura>();
  @Output() eliminada = new EventEmitter<number>();

  viewMode: FacturaModalViewMode = 'crear';
  loading = false;
  guardando = false;

  clientes: Cliente[] = [];
  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  selectedFile: File | null = null;
  restanteObra: number | null = null;
  montoSugerido: number | null = null;

  factura?: Factura;
  cliente?: Cliente;
  obra: Obra | null = null;
  facturasObra: Factura[] = [];
  cobrosObra = 0;
  previewUrl?: string;

  form!: FormGroup;
  estadoOptions = [
    {label: 'Emitida', value: 'EMITIDA'},
    {label: 'Cobrada', value: 'COBRADA'}
  ];

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.form = this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.abrir();
    }
    if (changes['visible'] && !this.visible) {
      this.limpiar();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      id_cliente: [null, Validators.required],
      id_obra: [null],
      fecha: [new Date(), Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      estado: ['EMITIDA', Validators.required]
    });
  }

  private abrir(): void {
    this.viewMode = this.mode;
    this.selectedFile = null;
    this.restanteObra = null;
    this.montoSugerido = null;
    this.cargarCatalogos();

    if (this.mode === 'crear') {
      this.form = this.buildForm();
      if (this.obraIdPreseleccionado) {
        this.form.patchValue({id_obra: this.obraIdPreseleccionado});
      }
    } else if (this.mode === 'detalle' && this.facturaId) {
      this.cargarDetalle(this.facturaId);
    }
  }

  private limpiar(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = undefined;
    }
    this.factura = undefined;
    this.cliente = undefined;
    this.obra = null;
    this.facturasObra = [];
    this.cobrosObra = 0;
  }

  private cargarCatalogos(): void {
    this.clientesService.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      }
    });
    this.obrasService.getObras().subscribe({
      next: obras => {
        this.obras = obras;
        this.actualizarObrasFiltradas();
        if (this.obraIdPreseleccionado) {
          this.aplicarPreseleccionCliente();
        }
      }
    });
  }

  private aplicarPreseleccionCliente(): void {
    const obra = this.obras.find(o => Number(o.id) === Number(this.obraIdPreseleccionado));
    const idCliente = obra ? Number(obra.id_cliente ?? obra.cliente?.id ?? 0) || null : null;
    if (idCliente) {
      this.form.patchValue({id_cliente: idCliente});
    }
    this.onClienteChange();
    if (this.obraIdPreseleccionado) {
      this.form.patchValue({id_obra: this.obraIdPreseleccionado});
      this.actualizarRestanteObra(Number(this.obraIdPreseleccionado));
    }
  }

  private cargarDetalle(id: number): void {
    this.loading = true;
    this.subs.add(
      this.facturasService.getFacturaById(id).pipe(
        switchMap(factura => {
          const obraId = factura.id_obra;
          return forkJoin({
            factura: of(factura),
            cliente: this.clientesService.getClienteById(factura.id_cliente),
            obra: obraId ? this.obrasService.getObraById(obraId) : of(null),
            facturasObra: obraId ? this.facturasService.getFacturasByObra(obraId) : of([]),
            movimientos: obraId ? this.transaccionesService.getByObra(obraId) : of([])
          });
        })
      ).subscribe({
        next: ({factura, cliente, obra, facturasObra, movimientos}) => {
          this.factura = {
            ...factura,
            cliente_nombre: cliente?.nombre,
            obra_nombre: obra?.nombre
          };
          this.cliente = cliente;
          this.obra = obra;
          this.facturasObra = facturasObra || [];
          this.cobrosObra = (movimientos || [])
            .filter(m => this.esCobro(m))
            .reduce((sum, m) => sum + Number(m.monto || 0), 0);
          this.cargarPreview();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo cargar la factura.'});
        }
      })
    );
  }

  private cargarPreview(): void {
    if (!this.factura?.id || !this.isImageFile(this.factura.nombre_archivo)) {
      return;
    }
    this.facturasService.downloadFactura(this.factura.id).subscribe(blob => {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewUrl = URL.createObjectURL(blob);
    });
  }

  entrarModoEditar(): void {
    if (!this.factura) return;
    this.viewMode = 'editar';
    this.selectedFile = null;
    this.form = this.buildForm();
    this.form.patchValue({
      id_cliente: this.factura.id_cliente,
      id_obra: this.factura.id_obra,
      fecha: this.parseDate(this.factura.fecha) ?? new Date(),
      monto: this.factura.monto ?? null,
      descripcion: this.factura.descripcion || '',
      estado: this.factura.estado || 'EMITIDA'
    });
    this.form.markAsPristine();
    this.actualizarObrasFiltradas();
    if (this.factura.id_obra) {
      this.actualizarRestanteObra(Number(this.factura.id_obra), Number(this.factura.id));
    }
  }

  onModalClosed(): void {
    if (this.viewMode === 'editar' && this.facturaId) {
      this.viewMode = 'detalle';
      return;
    }
    this.cerrar();
  }

  private cerrar(): void {
    this.closed.emit();
  }

  onClienteChange(): void {
    const idCliente = this.form.get('id_cliente')?.value;
    if (!idCliente) {
      this.actualizarObrasFiltradas();
      this.form.patchValue({id_obra: null});
      this.restanteObra = null;
      return;
    }
    this.obrasFiltradas = this.obras.filter(o =>
      Number(o.id_cliente || o.cliente?.id) === Number(idCliente) && this.esObraDisponibleParaFacturar(o)
    );
    this.form.patchValue({id_obra: null});
    this.restanteObra = null;
  }

  onObraChange(): void {
    const obraId = this.form.get('id_obra')?.value;
    if (!obraId) {
      this.restanteObra = null;
      this.montoSugerido = null;
      return;
    }
    this.actualizarRestanteObra(Number(obraId), this.viewMode === 'editar' ? this.facturaId ?? undefined : undefined);
  }

  onFileSelected(event: any): void {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.selectedFile = files?.[0] ?? null;
  }

  quitarArchivo(): void {
    this.selectedFile = null;
  }

  aplicarMontoTotal(): void {
    if (this.restanteObra == null) return;
    this.form.get('monto')?.setValue(this.restanteObra);
  }

  aplicarMontoParcial(): void {
    if (this.montoSugerido != null) {
      this.form.get('monto')?.setValue(this.montoSugerido);
    } else {
      this.form.get('monto')?.setValue(null);
    }
  }

  get puedeGuardar(): boolean {
    if (this.guardando) return false;
    if (this.viewMode === 'editar') return this.form.valid && (this.form.dirty || !!this.selectedFile);
    return this.form.valid;
  }

  guardar(): void {
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.messageService.add({severity: 'warn', summary: 'Faltan datos', detail: 'Completá cliente, fecha y monto antes de guardar.'});
      } else if (this.viewMode === 'editar') {
        this.messageService.add({severity: 'info', summary: 'Sin cambios', detail: 'No se detectaron cambios para guardar.'});
      }
      return;
    }
    const raw = this.form.value;
    const monto = Number(raw.monto);
    if (this.restanteObra != null && monto > this.restanteObra + 0.01) {
      this.messageService.add({severity: 'warn', summary: 'Monto invalido', detail: 'El monto supera el restante disponible de la obra.'});
      return;
    }
    const estado = this.viewMode === 'editar' ? (raw.estado || 'EMITIDA') : 'EMITIDA';
    const payload = {
      id_cliente: Number(raw.id_cliente),
      id_obra: raw.id_obra != null ? Number(raw.id_obra) : null,
      monto,
      monto_restante: estado === 'COBRADA' ? 0 : monto,
      fecha: this.formatDate(raw.fecha),
      descripcion: raw.descripcion || '',
      estado
    };

    this.guardando = true;
    if (this.viewMode === 'crear') {
      this.subs.add(
        this.facturasService.createFactura(payload, this.selectedFile).pipe(
          timeout(30000),
          finalize(() => this.guardando = false)
        ).subscribe({
          next: (factura) => {
            this.messageService.add({severity: 'success', summary: 'Factura creada', detail: 'La factura se guardo correctamente.'});
            this.guardada.emit(factura);
            this.cerrar();
          },
          error: (err) => {
            const detail = err?.name === 'TimeoutError'
              ? 'El servidor no respondio a tiempo. Intenta nuevamente.'
              : (err?.error?.message || 'No se pudo crear la factura.');
            this.messageService.add({severity: 'error', summary: 'Error', detail});
          }
        })
      );
    } else if (this.viewMode === 'editar' && this.facturaId) {
      this.subs.add(
        this.facturasService.updateFactura(this.facturaId, payload, this.selectedFile).pipe(
          timeout(30000),
          finalize(() => this.guardando = false)
        ).subscribe({
          next: (factura) => {
            this.messageService.add({severity: 'success', summary: 'Factura actualizada', detail: 'Los cambios se guardaron correctamente.'});
            this.guardada.emit(factura);
            this.cargarDetalle(this.facturaId!);
            this.viewMode = 'detalle';
          },
          error: (err) => {
            const detail = err?.name === 'TimeoutError'
              ? 'El servidor no respondio a tiempo. Intenta nuevamente.'
              : (err?.error?.message || 'No se pudo actualizar la factura.');
            this.messageService.add({severity: 'error', summary: 'Error', detail});
          }
        })
      );
    }
  }

  eliminar(): void {
    if (!this.factura?.id) return;
    const facturaId = this.factura.id;
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: `¿Estas seguro de eliminar la factura #${facturaId}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.facturasService.deleteFactura(facturaId).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Factura eliminada', detail: 'La factura se elimino correctamente.'});
            this.eliminada.emit(facturaId);
            this.cerrar();
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la factura.'});
          }
        });
      }
    });
  }

  toggleEstadoFactura(): void {
    if (!this.factura?.id) return;
    const estadoActual = (this.factura.estado || 'EMITIDA').toString().toUpperCase();
    const nuevoEstado = estadoActual === 'COBRADA' ? 'EMITIDA' : 'COBRADA';
    const payload = {
      id_cliente: Number(this.factura.id_cliente),
      id_obra: this.factura.id_obra != null ? Number(this.factura.id_obra) : null,
      monto: Number(this.factura.monto || 0),
      monto_restante: nuevoEstado === 'COBRADA' ? 0 : this.montoPorCobrarFactura,
      fecha: this.factura.fecha ? this.formatDate(this.factura.fecha) : this.formatDate(new Date()),
      descripcion: this.factura.descripcion || '',
      estado: nuevoEstado
    };

    this.facturasService.updateFactura(Number(this.factura.id), payload).subscribe({
      next: (updated) => {
        this.guardada.emit(updated);
        this.cargarDetalle(Number(this.factura!.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: nuevoEstado === 'COBRADA' ? 'Factura marcada como cobrada.' : 'Factura marcada como emitida.'
        });
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado de la factura.'});
      }
    });
  }

  get montoPorCobrarFactura(): number {
    if (!this.factura) return 0;
    const estado = (this.factura.estado || 'EMITIDA').toString().toUpperCase();
    if (estado === 'COBRADA') return 0;
    const restante = Number((this.factura as any).monto_restante ?? NaN);
    if (Number.isFinite(restante) && restante > 0) return restante;
    return Number(this.factura.monto ?? 0);
  }

  get totalPresupuesto(): number {
    return Number(this.obra?.presupuesto || 0);
  }

  get totalFacturado(): number {
    return this.facturasObra.reduce((sum, f) => sum + Number(f.monto || 0), 0);
  }

  get totalPorCobrar(): number {
    return Math.max(0, this.montoPorCobrarFactura);
  }

  get saldoNoFacturado(): number {
    return Math.max(0, this.totalPresupuesto - this.totalFacturado);
  }

  descargarArchivo(): void {
    if (!this.factura?.id || !this.factura?.nombre_archivo) return;
    this.subs.add(
      this.facturasService.downloadFacturaResponse(this.factura.id).subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.factura!.nombre_archivo || `factura_${this.factura!.id}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo.'});
        }
      })
    );
  }

  verArchivo(): void {
    if (!this.factura?.id || !this.factura?.nombre_archivo) return;
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.write('<p>Cargando adjunto...</p>');
    } else {
      this.messageService.add({severity: 'warn', summary: 'Bloqueo de ventana', detail: 'Habilita los pop-ups para ver el archivo.'});
      return;
    }
    this.subs.add(
      this.facturasService.downloadFacturaResponse(this.factura.id).subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            popup.close();
            return;
          }
          const tipo = this.detectarMime(this.factura?.nombre_archivo, blob.type);
          const fileBlob = tipo ? new Blob([blob], {type: tipo}) : blob;
          const url = URL.createObjectURL(fileBlob);
          popup.location.href = url;
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        },
        error: () => {
          popup.close();
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo abrir el archivo.'});
        }
      })
    );
  }

  protected isImageFile(nombre?: string): boolean {
    if (!nombre) return false;
    return /\.(jpg|jpeg|png)$/i.test(nombre);
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

  private actualizarObrasFiltradas(): void {
    const idCliente = this.form.get('id_cliente')?.value;
    this.obrasFiltradas = idCliente
      ? this.obras.filter(o => Number(o.id_cliente || o.cliente?.id) === Number(idCliente) && this.esObraDisponibleParaFacturar(o))
      : this.obras.filter(o => this.esObraDisponibleParaFacturar(o));
  }

  private esObraDisponibleParaFacturar(obra: Obra): boolean {
    if (!Boolean(obra.requiere_factura) || !Boolean(obra.activo ?? true)) {
      return false;
    }
    const estadoNormalizado = this.sanitizarEstado(String(obra.obra_estado || ''));
    return this.ESTADOS_PERMITIDOS.includes(estadoNormalizado);
  }

  private actualizarRestanteObra(obraId: number, excluirFacturaId?: number): void {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.restanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: facturas => {
        const facturado = (facturas || [])
          .filter(f => !excluirFacturaId || Number(f.id) !== Number(excluirFacturaId))
          .reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.restanteObra = Math.max(0, presupuesto - facturado);
        this.montoSugerido = this.restanteObra;
      },
      error: () => {
        this.restanteObra = null;
        this.montoSugerido = null;
      }
    });
  }

  private sanitizarEstado(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value).split('T')[0];
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private esCobro(mov: Transaccion): boolean {
    const raw: any = (mov as any).tipo_transaccion ?? (mov as any).tipo_movimiento ?? (mov as any).tipo;
    if (typeof raw === 'string') return raw.toUpperCase().includes('COBRO');
    if (raw && typeof raw.id === 'number') return raw.id === 1;
    const nombre = (raw?.nombre || '').toString().toUpperCase();
    return nombre.includes('COBRO');
  }
}
