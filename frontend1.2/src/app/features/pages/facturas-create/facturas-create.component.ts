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
import {InputNumber} from 'primeng/inputnumber';

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
    InputNumber
  ],
  providers: [MessageService],
  templateUrl: './facturas-create.component.html',
  styleUrls: ['./facturas-create.component.css']
})
export class FacturasCreateComponent implements OnInit {
  form!: FormGroup;
  clientes: Cliente[] = [];
  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  selectedFile: File | null = null;

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
      id_obra: [null, Validators.required],
      fecha: [new Date(), Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]]
    });

    this.clientesService.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      }
    });

    this.obrasService.getObras().subscribe({
      next: obras => {
        this.obras = obras;
        this.obrasFiltradas = [...this.obras];
      }
    });

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

    this.facturasService.createFactura(payload, this.selectedFile).subscribe({
      next: (factura) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Factura creada',
          detail: 'La factura se guardo correctamente.'
        });
        this.router.navigate(['/facturas', factura.id]);
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

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }
}
