import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription, forkJoin } from 'rxjs';

import { GrupoObrasService } from '../../../services/grupos-obras/grupos-obras.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { GruposModalService } from '../../../services/grupos-obras/grupos-modal.service';
import { GrupoObra, Cliente } from '../../../core/models/models';

@Component({
  selector: 'app-grupos-obras',
  templateUrl: './grupos-obras.component.html',
  styleUrls: ['./grupos-obras.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class GruposObrasComponent implements OnInit, OnDestroy {
  grupos: GrupoObra[] = [];
  gruposFiltrados: GrupoObra[] = [];
  clientes: Cliente[] = [];
  datosCargados = false;
  showModal = false;
  isEditing = false;
  form!: FormGroup;
  clientesOptions: any[] = [];
  searchValue: string = '';
  mostrarInactivos: boolean = false;

  private subs = new Subscription();

  constructor(
    private grupoObrasService: GrupoObrasService,
    private clientesService: ClientesService,
    private gruposModalService: GruposModalService,
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
    this.cargarDatos();
    this.subs.add(
      this.gruposModalService.openModal$.subscribe(() => {
        this.openNew();
      })
    );
  }

  private cargarDatos(): void {
    this.datosCargados = false;
    this.subs.add(
      forkJoin({
        clientes: this.clientesService.getClientes(),
        grupos: this.grupoObrasService.listar()
      }).subscribe({
        next: ({ clientes, grupos }) => {
          this.clientes = clientes;
          this.clientesOptions = clientes.map((c: Cliente) => ({ label: c.nombre, value: c.id }));
          this.grupos = grupos;
          this.applyFilter();
          this.datosCargados = true;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos'
          });
          this.datosCargados = true;
        }
      })
    );
  }

  applyFilter(): void {
    this.gruposFiltrados = this.grupos.filter(grupo => {
      const matchesSearch = !this.searchValue ||
        grupo.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        this.getNombreCliente(grupo.id_cliente).toLowerCase().includes(this.searchValue.toLowerCase());

      const matchesActivo = this.mostrarInactivos || grupo.activo;

      return matchesSearch && matchesActivo;
    });
  }

  onMostrarInactivosChange(): void {
    this.applyFilter();
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
            this.cargarDatos();
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
            this.cargarDatos();
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
              this.cargarDatos();
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
