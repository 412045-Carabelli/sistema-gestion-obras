import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OnboardingService } from '../../core/services/onboarding.service';

export type AppConfig = Record<string, string>;

export const CONFIG_KEYS = {
  EMPRESA_NOMBRE: 'empresa_nombre',
  PROPIETARIO_NOMBRE: 'propietario_nombre',
  WHATSAPP_PHONE: 'whatsapp_owner_phone',
  LOGO_URL: 'logo_url'
} as const;

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = `${environment.apiGateway}/bff/configuracion`;
  private configSubject = new BehaviorSubject<AppConfig>({});

  config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient, private onboardingService: OnboardingService) {
    this.cargar();
  }

  cargar(): void {
    this.http.get<AppConfig>(this.apiUrl).subscribe({
      next: config => {
        this.configSubject.next(config);
        this.onboardingService.actualizarEstadoEmpresa(!!config[CONFIG_KEYS.EMPRESA_NOMBRE]?.trim());
      },
      error: () => {}
    });
  }

  get(clave: string, defaultValue = ''): string {
    return this.configSubject.value[clave] ?? defaultValue;
  }

  guardar(valores: AppConfig): Observable<AppConfig> {
    return this.http.put<AppConfig>(this.apiUrl, valores).pipe(
      tap(updated => {
        this.configSubject.next(updated);
        this.onboardingService.actualizarEstadoEmpresa(!!updated[CONFIG_KEYS.EMPRESA_NOMBRE]?.trim());
      })
    );
  }
}
