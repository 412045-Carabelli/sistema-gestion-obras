import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer, switchMap, finalize, catchError } from 'rxjs';
import { MessageService } from 'primeng/api';

@Injectable()
export class LoadingServerInterceptor implements HttpInterceptor {

  private loadingShown = false;

  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const request$ = next.handle(req);

    // Mostramos el aviso si pasan 3 segundos sin respuesta
    const delayedNotice$ = timer(3000).pipe(
      switchMap(() => {
        if (!this.loadingShown) {
          this.loadingShown = true;
          this.messageService.add({
            severity: 'warn',
            summary: 'Servidor despertando...',
            detail: 'Puede tardar unos segundos ⏳',
            life: 8000
          });
        }
        // devolvemos un observable vacío, para no romper el tipo
        return request$;
      })
    );

    return delayedNotice$.pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.loadingShown) {
          this.messageService.add({
            severity: 'error',
            summary: 'Servidor no disponible',
            detail: 'Intentando reconectar...',
            life: 6000
          });
        }
        this.loadingShown = false;
        return throwError(() => error);
      }),
      finalize(() => this.loadingShown = false)
    );
  }
}
