import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, tap, catchError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

@Injectable()
export class ResponseAlertInterceptor implements HttpInterceptor {
  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = req.url.startsWith(environment.apiGateway);

    return next.handle(req).pipe(
      tap(() => {
        // Success toasts are handled by components to avoid duplication.
      }),
      catchError((error: HttpErrorResponse) => {
        if (isApiRequest && error.status >= 400 && error.status < 600 && error.status !== 404) {
          const message = this.extractMessage(error.error) || error.message || error.statusText;
          if (message) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
            detail: message
          });
          }
        }
        return throwError(() => error);
      })
    );
  }

  private extractMessage(body: any): string | null {
    if (!body) return null;
    if (typeof body === 'string') return body.trim() || null;
    if (typeof body !== 'object') return null;
    return (
      body.message ||
      body.mensaje ||
      body.error ||
      body.detail ||
      body.descripcion ||
      null
    );
  }
}
