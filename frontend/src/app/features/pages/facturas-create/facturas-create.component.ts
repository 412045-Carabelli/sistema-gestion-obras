import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ToastModule} from 'primeng/toast';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {FileUploadModule} from 'primeng/fileupload';
import {MessageService} from 'primeng/api';
import {HttpErrorResponse} from '@angular/common/http';
import {InputNumber} from 'primeng/inputnumber';
import {EditorModule} from 'primeng/editor';
import {CheckboxModule} from 'primeng/checkbox';

import {Cliente, Obra} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {FacturasService} from '../../../services/facturas/facturas.service';

@Component({
  selector: 'app-facturas-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ToastModule,
    ButtonModule,
    Select,
    DatePicker,
    FileUploadModule,
    InputNumber,
    EditorModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './facturas-create.component.html',
  styleUrls: ['./facturas-create.component.css']
})
export class FacturasCreateComponent implements OnInit {
  form!: FormGroup;
  clientes: Cliente[] = [];
  clientesFacturables: Cliente[] = [];
  obras: Obra[] = [];
  obrasFacturables: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  selectedFile: File | null = null;
  restanteObra: number | null = null;
  montoSugerido: number | null = null;
  guardando = false;
  estadoOptions = [
    {label: 'Emitida', value: 'EMITIDA'},
    {label: 'Cobrada', value: 'COBRADA'}
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private facturasService: FacturasService,
    private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      id_cliente: [null, Validators.required],
      id_obra: [null],
      fecha: [new Date(), Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      estado: ['EMITIDA', Validators.required],
      impacta_cta_cte: [false]
    });

    this.clientesService.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
        this.actualizarClientesFacturables();
      }
    });

    this.obrasService.getObras().subscribe({
      next: obras => {
        this.obras = obras;
        this.obrasFacturables = this.obras.filter(o => this.esObraFacturable(o));
        this.obrasFiltradas = [...this.obrasFacturables];
        this.actualizarClientesFacturables();
      }
    });

    this.form.get('id_cliente')?.valueChanges.subscribe((clienteId) => {
      if (!clienteId) {
        this.obrasFiltradas = [...this.obrasFacturables];
        this.form.get('id_obra')?.setValue(null);
        this.restanteObra = null;
        return;
      }
      this.obrasFiltradas = this.obrasFacturables.filter(o => Number(o.cliente?.id) === Number(clienteId));
      this.form.get('id_obra')?.setValue(null);
      this.restanteObra = null;
    });

    this.form.get('id_obra')?.valueChanges.subscribe((obraId) => {
      if (!obraId) {
        this.restanteObra = null;
        this.montoSugerido = null;
        return;
      }
      this.actualizarRestanteObra(Number(obraId));
    });

    this.form.get('monto')?.valueChanges.subscribe((value) => {
      if (value == null) return;
      this.montoSugerido = Number(value);
    });
  }

  onFileSelected(event: any) {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.selectedFile = files?.[0] ?? null;
  }

  quitarArchivo() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const monto = Number(raw.monto);
    if (raw.impacta_cta_cte && !raw.id_obra) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta obra',
        detail: 'Selecciona una obra para impactar en cuenta corriente.'
      });
      return;
    }
    if (this.restanteObra != null && monto > this.restanteObra + 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'El monto supera el restante disponible de la obra.'
      });
      return;
    }
    const estado = (raw.estado || '').toString().toUpperCase();
    const montoRestante = estado === 'COBRADA' ? 0 : monto;
    const payload = {
      id_cliente: Number(raw.id_cliente),
      id_obra: raw.id_obra != null ? Number(raw.id_obra) : null,
      monto,
      monto_restante: montoRestante,
      fecha: this.formatDate(raw.fecha),
      descripcion: raw.descripcion || '',
      estado: raw.estado,
      impacta_cta_cte: !!raw.impacta_cta_cte
    };

    this.guardando = true;
    this.facturasService.createFactura(payload, this.selectedFile).subscribe({
      next: (factura) => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Factura creada',
          detail: 'La factura se guardo correctamente.'
        });
        this.router.navigate(['/facturas', factura.id]);
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.obtenerMensajeError(err, 'No se pudo crear la factura.')
        });
      }
    });
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }

  private actualizarRestanteObra(obraId: number) {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.restanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: facturas => {
        const facturado = (facturas || []).reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.restanteObra = Math.max(0, presupuesto - facturado);
        this.montoSugerido = this.restanteObra;
      },
      error: () => {
        this.restanteObra = null;
        this.montoSugerido = null;
      }
    });
  }

  private obtenerMensajeError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body: any = err.error;
      if (typeof body === 'string') return body;
      if (body?.message) return body.message;
      if (body?.error) return body.error;
    }
    return fallback;
  }

  aplicarMontoTotal() {
    if (this.restanteObra == null) return;
    this.form.get('monto')?.setValue(this.restanteObra);
  }

  aplicarMontoParcial() {
    if (this.montoSugerido != null) {
      this.form.get('monto')?.setValue(this.montoSugerido);
    } else {
      this.form.get('monto')?.setValue(null);
    }
  }

  private actualizarClientesFacturables() {
    if (!this.clientes.length || !this.obrasFacturables.length) {
      this.clientesFacturables = [];
      return;
    }
    const clientesConObras = new Set(
      this.obrasFacturables
        .map(o => Number(o.cliente?.id ?? 0))
        .filter(id => id > 0)
    );
    this.clientesFacturables = this.clientes.filter(c => clientesConObras.has(Number(c.id)));
  }

  private esObraFacturable(obra: Obra): boolean {
    if (!obra || !Number(obra.id ?? 0) || !Boolean(obra.activo ?? true)) return false;
    const raw = (obra as any).obra_estado;
    let nombre = '';
    if (typeof raw === 'string') nombre = raw;
    else if (raw && typeof raw === 'object') nombre = raw.nombre ?? raw.name ?? raw.label ?? raw.estado ?? '';
    const estado = this.sanitizarEstado(String(nombre));
    return estado !== 'FACTURADA';
  }

  private normalizarEstado(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string') return this.sanitizarEstado(raw);
    const nombre = raw?.nombre ?? raw?.name ?? raw?.label ?? raw?.estado ?? '';
    return this.sanitizarEstado(String(nombre || ''));
  }

  private sanitizarEstado(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
