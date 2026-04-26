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
  catchError
} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class LoadingServerInterceptor implements HttpInterceptor {

  constructor(
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = req.url.startsWith(environment.apiGateway);

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (isApiRequest && error.status === 404 && req.method === 'GET') {
          this.router.navigateByUrl('/dashboard');
        }
        return throwError(() => error);
      })
    );
  }
}
