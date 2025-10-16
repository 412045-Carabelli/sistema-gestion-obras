import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {CheckboxModule} from 'primeng/checkbox';

import {ClientesService} from '../../../services/clientes/clientes.service';
import {Cliente} from '../../../core/models/models';

@Component({
  selector: 'app-clientes-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ToastModule, ButtonModule, InputTextModule, CheckboxModule],
  providers: [MessageService],
  templateUrl: './clientes-create.component.html',
  styleUrls: ['./clientes-create.component.css']
})
export class ClientesCreateComponent implements OnInit {
  form!: FormGroup;
  editing = false;
  clienteId!: number;

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
      cuit: [''],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      activo: [true]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editing = true;
      this.clienteId = Number(idParam);
      this.cargarCliente(this.clienteId);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data: Cliente = this.form.value;

    if (this.editing) {
      this.clientesService.updateCliente(this.clienteId, data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente actualizado',
            detail: 'Los cambios se guardaron correctamente.'
          });
          this.router.navigate(['/clientes', this.clienteId]);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el cliente.'
          });
        }
      });
    } else {
      this.clientesService.createCliente(data).subscribe({
        next: (nuevo) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente creado',
            detail: 'El cliente se creó correctamente.'
          });
          this.router.navigate(['/clientes', nuevo.id]);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el cliente.'
          });
        }
      });
    }
  }

  private cargarCliente(id: number) {
    this.clientesService.getClienteById(id).subscribe({
      next: (cliente) => {
        this.form.patchValue(cliente);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el cliente.'
        });
      }
    });
  }
}
