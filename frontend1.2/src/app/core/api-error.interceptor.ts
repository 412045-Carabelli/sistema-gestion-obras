import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiErrorService } from './api-error.service';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {

  constructor(private apiErrorService: ApiErrorService, private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.apiErrorService.parse(error);
        const shouldNotify = error.status === 0 || error.status >= 500;
        if (shouldNotify) {
          this.messageService.add({
            severity: 'error',
            summary: `Error ${apiError?.status ?? error.status}`,
            detail: apiError?.message || 'Ocurrió un error al comunicar con el servidor.',
            life: 7000
          });
        }
        return throwError(() => error);
      })
    );
  }
}
