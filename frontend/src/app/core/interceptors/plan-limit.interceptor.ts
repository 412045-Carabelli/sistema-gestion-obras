import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PlanLimitError } from '../../core/models/models';

/**
 * Intercepta HTTP 402 Payment Required del backend.
 * Muestra toast informativo y permite que el componente maneje el error también.
 *
 * El componente puede hacer catchError propio para mostrar el UpgradeBanner inline.
 * Este interceptor solo agrega el toast global.
 */
@Injectable()
export class PlanLimitInterceptor implements HttpInterceptor {

  private router = inject(Router);
  private messageService = inject(MessageService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 402) {
          const body = error.error as PlanLimitError;

          if (body?.code === 'PLAN_LIMIT_EXCEEDED') {
            this.messageService.add({
              severity: 'warn',
              summary: `Límite alcanzado`,
              detail: `Llegaste al límite de ${body.recurso ?? 'registros'} de tu plan. Actualizá para continuar.`,
              life: 6000
            });
          } else if (body?.code === 'FEATURE_NOT_AVAILABLE') {
            this.messageService.add({
              severity: 'warn',
              summary: 'Función no disponible',
              detail: `"${body.feature ?? 'Esta función'}" requiere un plan superior.`,
              life: 6000
            });
          }

          // Re-throw para que el componente también pueda manejar el error
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }
}
