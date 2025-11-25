import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';

import {ClientesService} from '../../../services/clientes/clientes.service';
import {Cliente} from '../../../core/models/models';
import {ProgressSpinner} from 'primeng/progressspinner';

@Component({
  selector: 'app-clientes-edit',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ToastModule, ButtonModule, InputTextModule, Select, ProgressSpinner],
  providers: [MessageService],
  templateUrl: './clientes-edit.component.html',
  styleUrls: ['./clientes-edit.component.css']
})
export class ClientesEditComponent implements OnInit {
  form!: FormGroup;
  clienteId!: number;
  loading = true;
  ivaOptions: { label: string; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      contacto: ['', Validators.required],
      cuit: ['', Validators.required],
      condicion_iva: [null, Validators.required],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      activo: [true]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.clienteId = Number(idParam);
      this.cargarCliente(this.clienteId);
    }

    this.clientesService.getCondicionesIva().subscribe({
      next: (opciones) => (this.ivaOptions = opciones),
      error: () => (this.ivaOptions = [])
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data: Cliente = this.form.value;

    this.clientesService.updateCliente(this.clienteId, data).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente actualizado',
          detail: 'Los cambios se guardaron correctamente.'
        });

        // 🕒 Esperar 2 segundos para que se vea el toast
        setTimeout(() => {
          this.router.navigate(['/clientes']);
        }, 1000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el cliente.'
        });
      }
    });
  }

  private cargarCliente(id: number) {
    this.clientesService.getClienteById(id).subscribe({
      next: (cliente) => {
        this.form.patchValue(cliente);
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el cliente.'
        });
        this.loading = false;
      }
    });
  }
}
