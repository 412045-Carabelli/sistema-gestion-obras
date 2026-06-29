import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../services/auth/auth.service';
import { UsuarioInfoResponse } from '../../../../core/models/models';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios-admin.component.html'
})
export class UsuariosAdminComponent implements OnInit, OnDestroy {
  usuarios: UsuarioInfoResponse[] = [];
  cargando = false;
  guardando = false;
  cambiandoEstado = false;
  mostrarFormulario = false;
  usuarioEditando: UsuarioInfoResponse | null = null;
  formCrear!: FormGroup;
  formEditar!: FormGroup;
  private sub = new Subscription();

  readonly rolesOpciones = [
    { label: 'Usuario', value: 'USER' },
    { label: 'Administrador', value: 'ADMIN' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.formCrear = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rol: ['USER', Validators.required]
    });

    this.formEditar = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['USER', Validators.required]
    });

    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private cargarUsuarios(): void {
    this.cargando = true;
    this.sub.add(
      this.authService.listarUsuariosOrganizacion().subscribe({
        next: (data) => {
          this.usuarios = data;
          this.cargando = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
          this.cargando = false;
        }
      })
    );
  }

  guardarUsuario(): void {
    if (this.formCrear.invalid || this.guardando) return;
    this.guardando = true;
    this.sub.add(
      this.authService.crearUsuarioOrganizacion(this.formCrear.getRawValue()).subscribe({
        next: (nuevo) => {
          this.usuarios = [...this.usuarios, nuevo];
          this.guardando = false;
          this.mostrarFormulario = false;
          this.formCrear.reset({ rol: 'USER' });
          this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Usuario creado correctamente' });
        },
        error: (err) => {
          this.guardando = false;
          const msg = err?.error?.message ?? 'No se pudo crear el usuario';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      })
    );
  }

  abrirEdicion(usuario: UsuarioInfoResponse): void {
    this.usuarioEditando = usuario;
    this.formEditar.patchValue({
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
      email: usuario.email,
      rol: usuario.rol
    });
  }

  guardarEdicion(): void {
    if (this.formEditar.invalid || this.guardando || !this.usuarioEditando) return;
    this.guardando = true;
    this.sub.add(
      this.authService.actualizarUsuarioOrganizacion(this.usuarioEditando.id, this.formEditar.getRawValue()).subscribe({
        next: (actualizado) => {
          this.usuarios = this.usuarios.map(u => u.id === actualizado.id ? actualizado : u);
          this.guardando = false;
          this.usuarioEditando = null;
          this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Usuario actualizado' });
        },
        error: (err) => {
          this.guardando = false;
          const msg = err?.error?.message ?? 'No se pudo actualizar el usuario';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      })
    );
  }

  confirmarCambioEstado(usuario: UsuarioInfoResponse): void {
    const accion = usuario.activo ? 'dar de baja' : 'reactivar';
    this.confirmationService.confirm({
      message: `¿Estás seguro de ${accion} al usuario <strong>${usuario.username}</strong>?`,
      header: usuario.activo ? 'Dar de baja' : 'Reactivar usuario',
      icon: usuario.activo ? 'pi pi-ban' : 'pi pi-check-circle',
      acceptLabel: usuario.activo ? 'Dar de baja' : 'Reactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: usuario.activo ? 'p-button-danger' : 'p-button-success',
      accept: () => this.cambiarEstado(usuario)
    });
  }

  private cambiarEstado(usuario: UsuarioInfoResponse): void {
    if (this.cambiandoEstado) return;
    const nuevoEstado = !usuario.activo;
    this.cambiandoEstado = true;
    this.sub.add(
      this.authService.cambiarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
        next: (actualizado) => {
          this.cambiandoEstado = false;
          this.usuarios = this.usuarios.map(u => u.id === actualizado.id ? actualizado : u);
          const msg = nuevoEstado ? 'Usuario reactivado' : 'Usuario dado de baja';
          this.messageService.add({ severity: 'success', summary: 'Listo', detail: msg });
        },
        error: (err) => {
          this.cambiandoEstado = false;
          const msg = err?.error?.message ?? 'No se pudo cambiar el estado';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      })
    );
  }

  cancelarCreacion(): void {
    this.mostrarFormulario = false;
    this.formCrear.reset({ rol: 'USER' });
  }

  rolSeverity(rol: string): 'success' | 'info' | 'warn' {
    return rol === 'ADMIN' ? 'warn' : 'info';
  }
}
