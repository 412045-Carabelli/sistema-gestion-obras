import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import {
  Observable,
  throwError,
  timer,
  finalize,
  catchError,
  merge,
  tap,
  ignoreElements,
  retryWhen,
  mergeMap
} from 'rxjs';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class LoadingServerInterceptor implements HttpInterceptor {

  private loadingShown = false;
  private retryNoticeShown = false;
  private readonly maxRetries = 8;
  private readonly retryDelayMs = 1500;

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = req.url.startsWith(environment.apiGateway);
    let requestDone = false;

    const notice$ = timer(3000).pipe(
      tap(() => {
        if (!requestDone && !this.loadingShown && isApiRequest) {
          this.loadingShown = true;
          this.messageService.add({
            severity: 'warn',
            summary: 'Servidor despertando...',
            detail: 'Puede tardar unos segundos...',
            life: 8000
          });
        }
      }),
      ignoreElements()
    );

    const request$ = next.handle(req).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, attempt) => {
            if (!isApiRequest) {
              return throwError(() => error);
            }

            if (error.status === 404 && req.method === 'GET') {
              this.router.navigateByUrl('/dashboard');
              return throwError(() => error);
            }

            const retriable =
              error.status === 0 ||
              error.status === 500 ||
              error.status === 502 ||
              error.status === 503 ||
              error.status === 504;

            if (!retriable || attempt >= this.maxRetries) {
              return throwError(() => error);
            }

            if (!this.retryNoticeShown) {
              this.retryNoticeShown = true;
              this.messageService.add({
                severity: 'error',
                summary: 'Servidor no disponible',
                detail: 'Reintentando conexión...',
                life: 6000
              });
            }

            return timer(this.retryDelayMs);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => throwError(() => error)),
      finalize(() => {
        requestDone = true;
        this.loadingShown = false;
        this.retryNoticeShown = false;
      })
    );

    return merge(request$, notice$);
  }
}
