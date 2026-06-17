import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ConfiguracionService, CONFIG_KEYS } from '../../../services/configuracion/configuracion.service';
import { AuthService } from '../../../services/auth/auth.service';
import { DocumentosService } from '../../../services/documentos/documentos.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPass = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return newPass && confirm && newPass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DividerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  formEmpresa!: FormGroup;
  formPassword!: FormGroup;
  formPerfil!: FormGroup;
  guardandoEmpresa = false;
  guardandoPassword = false;
  guardandoPerfil = false;
  logoUploading = false;
  logoDragOver = false;
  private sub = new Subscription();

  readonly CONFIG_KEYS = CONFIG_KEYS;

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionService,
    private authService: AuthService,
    private documentosService: DocumentosService,
    private messageService: MessageService
  ) {}

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.rol === 'ADMIN';
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.formPerfil = this.fb.group({
      nombre: [user?.nombre ?? '', Validators.required],
      apellido: [user?.apellido ?? '', Validators.required],
      email: [user?.email ?? '', [Validators.required, Validators.email]]
    });

    this.formEmpresa = this.fb.group({
      empresa_nombre: ['', Validators.required],
      propietario_nombre: ['', Validators.required],
      whatsapp_owner_phone: [''],
      logo_url: ['']
    });

    this.formPassword = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });

    this.sub.add(
      this.configuracionService.config$.subscribe(config => {
        if (Object.keys(config).length > 0) {
          this.formEmpresa.patchValue({
            empresa_nombre: config[CONFIG_KEYS.EMPRESA_NOMBRE] ?? '',
            propietario_nombre: config[CONFIG_KEYS.PROPIETARIO_NOMBRE] ?? '',
            whatsapp_owner_phone: config[CONFIG_KEYS.WHATSAPP_PHONE] ?? '',
            logo_url: config[CONFIG_KEYS.LOGO_URL] ?? ''
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get phoneVacio(): boolean {
    return !(this.formEmpresa.get('whatsapp_owner_phone')?.value?.trim());
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    this.logoDragOver = true;
  }

  onLogoDragLeave(): void {
    this.logoDragOver = false;
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    this.logoDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.subirLogo(file);
  }

  onLogoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.subirLogo(file);
  }

  private subirLogo(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Archivo inválido', detail: 'Solo se permiten imágenes' });
      return;
    }
    this.logoUploading = true;
    this.documentosService.uploadLogo(file).subscribe({
      next: (res) => {
        this.formEmpresa.patchValue({ logo_url: res.url });
        this.configuracionService.guardar({ logo_url: res.url }).subscribe({
          next: () => {
            this.logoUploading = false;
            this.messageService.add({ severity: 'success', summary: 'Logo guardado', detail: 'El logo se actualizó correctamente' });
          },
          error: () => {
            this.logoUploading = false;
            this.messageService.add({ severity: 'warn', summary: 'Logo subido', detail: 'No se pudo guardar automáticamente' });
          }
        });
      },
      error: () => {
        this.logoUploading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el logo' });
      }
    });
  }

  guardarEmpresa(): void {
    if (this.formEmpresa.invalid || this.guardandoEmpresa) return;
    this.guardandoEmpresa = true;
    this.configuracionService.guardar(this.formEmpresa.getRawValue()).subscribe({
      next: () => {
        this.guardandoEmpresa = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada' });
      },
      error: () => {
        this.guardandoEmpresa = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      }
    });
  }

  guardarPerfil(): void {
    if (this.formPerfil.invalid || this.guardandoPerfil) return;
    this.guardandoPerfil = true;
    this.authService.updatePerfil(this.formPerfil.getRawValue()).subscribe({
      next: () => {
        this.guardandoPerfil = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado' });
      },
      error: (err) => {
        this.guardandoPerfil = false;
        const msg = err?.error?.message ?? 'No se pudo actualizar el perfil';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  cambiarPassword(): void {
    if (this.formPassword.invalid || this.guardandoPassword) return;
    this.guardandoPassword = true;
    const { currentPassword, newPassword, confirmPassword } = this.formPassword.getRawValue();
    this.authService.changePassword({ currentPassword, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.guardandoPassword = false;
        this.formPassword.reset();
        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Contraseña actualizada' });
      },
      error: (err) => {
        this.guardandoPassword = false;
        const msg = err?.error?.message ?? 'No se pudo cambiar la contraseña';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }
}
