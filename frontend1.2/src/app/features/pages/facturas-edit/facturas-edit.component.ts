import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ToastModule} from 'primeng/toast';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {FileUploadModule} from 'primeng/fileupload';
import {MessageService} from 'primeng/api';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {InputNumber} from 'primeng/inputnumber';
import {EditorModule} from 'primeng/editor';
import {CheckboxModule} from 'primeng/checkbox';

import {Cliente, Factura, Obra} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {FacturasService} from '../../../services/facturas/facturas.service';

@Component({
  selector: 'app-facturas-edit',
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
    ProgressSpinnerModule,
    InputNumber,
    EditorModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './facturas-edit.component.html',
  styleUrls: ['./facturas-edit.component.css']
})
export class FacturasEditComponent implements OnInit {
  form!: FormGroup;
  facturaId!: number;
  factura?: Factura;
  clientes: Cliente[] = [];
  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  selectedFile: File | null = null;
  loading = true;
  restanteObra: number | null = null;
  estadoOptions = [
    {label: 'Emitida', value: 'EMITIDA'},
    {label: 'Cobrada', value: 'COBRADA'}
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
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
      fecha: [null, Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      estado: ['EMITIDA', Validators.required],
      impacta_cta_cte: [false]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.facturaId = Number(idParam);
      this.cargarDatos();
    }

    this.form.get('id_cliente')?.valueChanges.subscribe((clienteId) => {
      if (!clienteId) {
        this.obrasFiltradas = [...this.obras];
        this.form.get('id_obra')?.setValue(null);
        this.restanteObra = null;
        return;
      }
      this.obrasFiltradas = this.obras.filter(o => Number(o.cliente?.id) === Number(clienteId));
      this.form.get('id_obra')?.setValue(null);
      this.restanteObra = null;
    });

    this.form.get('id_obra')?.valueChanges.subscribe((obraId) => {
      if (!obraId) {
        this.restanteObra = null;
        return;
      }
      this.actualizarRestanteObra(Number(obraId), this.facturaId);
    });
  }

  cargarDatos() {
    this.loading = true;
    this.facturasService.getFacturaById(this.facturaId).subscribe({
      next: factura => {
        this.factura = factura;
        this.form.patchValue({
          id_cliente: factura.id_cliente,
          id_obra: factura.id_obra,
          fecha: this.parseDate(factura.fecha),
          monto: factura.monto,
          descripcion: factura.descripcion || '',
          estado: factura.estado || 'EMITIDA',
          impacta_cta_cte: !!factura.impacta_cta_cte
        });
        this.cargarCatalogos();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la factura.'
        });
      }
    });
  }

  cargarCatalogos() {
    this.clientesService.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      }
    });

    this.obrasService.getObras().subscribe({
      next: obras => {
        this.obras = obras;
        const clienteId = this.form.get('id_cliente')?.value;
        this.obrasFiltradas = clienteId
          ? obras.filter(o => Number(o.cliente?.id) === Number(clienteId))
          : [...obras];
        const obraId = this.form.get('id_obra')?.value;
        if (obraId) {
          this.actualizarRestanteObra(Number(obraId), this.facturaId);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
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
    if (this.form.invalid) {
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
    const payload = {
      id_cliente: Number(raw.id_cliente),
      id_obra: raw.id_obra != null ? Number(raw.id_obra) : null,
      monto,
      fecha: this.formatDate(raw.fecha),
      descripcion: raw.descripcion || '',
      estado: raw.estado,
      impacta_cta_cte: !!raw.impacta_cta_cte
    };

    this.facturasService.updateFactura(this.facturaId, payload, this.selectedFile).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Factura actualizada',
          detail: 'Los cambios se guardaron correctamente.'
        });
        this.router.navigate(['/facturas', this.facturaId]);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la factura.'
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

  private parseDate(value?: string): Date | null {
    return value ? new Date(value) : null;
  }

  private actualizarRestanteObra(obraId: number, facturaId?: number) {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.restanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: facturas => {
        const facturado = (facturas || [])
          .filter(f => !facturaId || Number(f.id) !== Number(facturaId))
          .reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.restanteObra = Math.max(0, presupuesto - facturado);
      },
      error: () => {
        this.restanteObra = null;
      }
    });
  }
}
