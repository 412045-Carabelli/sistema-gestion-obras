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
    InputNumber
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
      id_obra: [null, Validators.required],
      fecha: [null, Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]]
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
        return;
      }
      this.obrasFiltradas = this.obras.filter(o => Number(o.cliente?.id) === Number(clienteId));
      this.form.get('id_obra')?.setValue(null);
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
          monto: factura.monto
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
    const payload = {
      id_cliente: Number(raw.id_cliente),
      id_obra: Number(raw.id_obra),
      monto: Number(raw.monto),
      fecha: this.formatDate(raw.fecha)
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
}
