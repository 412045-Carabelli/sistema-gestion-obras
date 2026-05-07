import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { GrupoObrasService } from '../../../services/grupos-obras/grupos-obras.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { GrupoObra, Cliente } from '../../../core/models/models';

@Component({
  selector: 'app-grupos-obras',
  templateUrl: './grupos-obras.component.html',
  styleUrls: ['./grupos-obras.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class GruposObrasComponent implements OnInit, OnDestroy {
  grupos: GrupoObra[] = [];
  clientes: Cliente[] = [];
  loading = false;
  showModal = false;
  isEditing = false;
  form!: FormGroup;
  clientesOptions: any[] = [];

  private subs = new Subscription();

  constructor(
    private grupoObrasService: GrupoObrasService,
    private clientesService: ClientesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      id: [null],
      id_cliente: [null, Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarGrupos();
  }

  private cargarClientes(): void {
    this.subs.add(
      this.clientesService.getClientes().subscribe({
        next: (data: Cliente[]) => {
          this.clientes = data;
          this.clientesOptions = data.map((c: Cliente) => ({ label: c.nombre, value: c.id }));
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los clientes'
          });
        }
      })
    );
  }

  private cargarGrupos(): void {
    this.loading = true;
    this.subs.add(
      this.grupoObrasService.listar().subscribe({
        next: (data: GrupoObra[]) => {
          this.grupos = data;
          this.loading = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los grupos'
          });
          this.loading = false;
        }
      })
    );
  }

  openNew(): void {
    this.isEditing = false;
    this.form.reset();
    this.showModal = true;
  }

  editGrupo(grupo: GrupoObra): void {
    this.isEditing = true;
    this.form.patchValue(grupo);
    this.showModal = true;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    if (this.isEditing) {
      this.subs.add(
        this.grupoObrasService.actualizar(payload.id, payload).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Grupo actualizado correctamente'
            });
            this.cargarGrupos();
            this.showModal = false;
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Error al actualizar'
            });
          }
        })
      );
    } else {
      this.subs.add(
        this.grupoObrasService.crear(payload).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Creado',
              detail: 'Grupo creado correctamente'
            });
            this.cargarGrupos();
            this.showModal = false;
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Error al crear'
            });
          }
        })
      );
    }
  }

  deleteGrupo(grupo: GrupoObra): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el grupo "${grupo.nombre}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.subs.add(
          this.grupoObrasService.eliminar(grupo.id!).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Grupo eliminado correctamente'
              });
              this.cargarGrupos();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el grupo'
              });
            }
          })
        );
      }
    });
  }

  getNombreCliente(idCliente?: number): string {
    if (!idCliente) return '-';
    return this.clientes.find(c => c.id === idCliente)?.nombre || '-';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
