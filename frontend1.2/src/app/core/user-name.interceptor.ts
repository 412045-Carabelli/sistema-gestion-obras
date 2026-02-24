import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class UserNameInterceptor implements HttpInterceptor {
  private readonly storageKey = 'auditUserName';
  private readonly headerName = 'X-User-Name';

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let userName = '';
    try {
      userName = localStorage.getItem(this.storageKey) ?? '';
    } catch {
      userName = '';
    }

    if (!userName) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        headers: req.headers.set(this.headerName, userName)
      })
    );
  }
}
