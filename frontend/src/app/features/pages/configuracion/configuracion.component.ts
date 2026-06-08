import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ConfiguracionService, CONFIG_KEYS } from '../../../services/configuracion/configuracion.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  guardando = false;
  private sub = new Subscription();

  readonly CONFIG_KEYS = CONFIG_KEYS;

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      empresa_nombre: ['', Validators.required],
      propietario_nombre: ['', Validators.required],
      whatsapp_owner_phone: [''],
      logo_url: ['']
    });

    this.sub.add(
      this.configuracionService.config$.subscribe(config => {
        if (Object.keys(config).length > 0) {
          this.form.patchValue({
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
    return !(this.form.get('whatsapp_owner_phone')?.value?.trim());
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) return;
    this.guardando = true;

    const valores = this.form.getRawValue();

    this.configuracionService.guardar(valores).subscribe({
      next: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Configuración actualizada correctamente'
        });
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la configuración'
        });
      }
    });
  }
}
