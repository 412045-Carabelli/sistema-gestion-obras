import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // No agregar token a rutas públicas de auth
    const publicAuthRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
    if (publicAuthRoutes.some(route => req.url.includes(route))) {
      return next.handle(req);
    }

    const token = this.authService.getAccessToken();
    const authReq = token ? this.addToken(req, token) : req;

    // Rutas que pueden devolver 401 por lógica de negocio (no por token expirado)
    const businessAuthRoutes = ['/auth/change-password', '/auth/perfil', '/auth/admin'];
    const isBusinessAuth = businessAuthRoutes.some(route => req.url.includes(route));

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isBusinessAuth) {
          return this.handle401(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const user = this.authService.getCurrentUser();
    if (user?.organizacionId != null) {
      headers['X-Organizacion-Id'] = String(user.organizacionId);
    }
    if (user?.userId != null) {
      headers['X-User-Id'] = String(user.userId);
    }
    if (user?.username != null) {
      headers['X-User-Name'] = user.username;
    }
    return req.clone({ setHeaders: headers });
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('No refresh token'));
    }

    if (this.refreshing) {
      // Esperar a que termine el refresh en curso
      return this.refreshSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }

    this.refreshing = true;
    this.refreshSubject.next(null);

    return this.authService.refresh(refreshToken).pipe(
      switchMap(response => {
        this.refreshing = false;
        this.refreshSubject.next(response.access_token);
        return next.handle(this.addToken(req, response.access_token));
      }),
      catchError(err => {
        this.refreshing = false;
        console.warn('Refresh token inválido, redirigiendo a login');
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }
}
