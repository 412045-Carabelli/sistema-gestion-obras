import {PreventInvalidSubmitDirective} from "../../../shared/directives/prevent-invalid-submit.directive";
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

@Component({
  selector: 'app-clientes-form',
  standalone: true,
  imports: [PreventInvalidSubmitDirective, RouterLink, ReactiveFormsModule, ToastModule, ButtonModule, InputTextModule, Select],
  providers: [MessageService],
  templateUrl: './clientes-create.component.html',
  styleUrls: ['./clientes-create.component.css']
})
export class ClientesCreateComponent implements OnInit {
  form!: FormGroup;
  editing = false;
  clienteId!: number;
  ivaOptions: { label: string; name: string }[] = [];
  guardando = false;

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
      direccion: [''],
      cuit: ['', Validators.required],
      condicion_iva: [null, Validators.required],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
      email: ['', [Validators.email]],
      activo: [true, Validators.required]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editing = true;
      this.clienteId = Number(idParam);
      this.cargarCliente(this.clienteId);
    }

    this.clientesService.getCondicionesIva().subscribe({
      next: (opciones) => (this.ivaOptions = opciones),
      error: () => {
        this.ivaOptions = [];
      }
    });
  }

  private normalizarTelefono(tel: string | undefined): string {
    if (!tel) return '';
    let solo = String(tel).replace(/[^0-9]/g, '');
    if (solo.startsWith('549')) solo = '54' + solo.substring(3);
    else if (solo.startsWith('54')) return solo;
    else if (solo.startsWith('9')) solo = '54' + solo.substring(1);
    else solo = '54' + solo;
    return solo;
  }

  onSubmit() {
    if (this.form.invalid || this.guardando) return;

    const data: Cliente = this.form.value;
    if (data.telefono) data.telefono = this.normalizarTelefono(data.telefono);

    this.guardando = true;
    if (this.editing) {
      this.clientesService.updateCliente(this.clienteId, data).subscribe({
        next: () => {
          this.guardando = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente actualizado',
            detail: 'Los cambios se guardaron correctamente.'
          });
          this.router.navigate(['/clientes', this.clienteId]);
        },
        error: () => {
          this.guardando = false;
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
          this.guardando = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente creado',
            detail: 'El cliente se creó correctamente.'
          });
          this.router.navigate(['/clientes', nuevo.id]);
        },
        error: () => {
          this.guardando = false;
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
        this.form.patchValue({
          ...cliente,
          condicion_iva: (cliente as any).condicionIVA ?? cliente.condicion_iva ?? null,
          activo: cliente.activo ?? true
        });
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


