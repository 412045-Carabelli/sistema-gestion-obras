import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, ChangePasswordRequest, UpdatePerfilRequest, AuthResponse, UserInfo, CreateUsuarioOrganizacionRequest, UpdateUsuarioOrganizacionRequest, UsuarioInfoResponse } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.auth}`;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => error);
        })
      );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Register error', error);
          return throwError(() => error);
        })
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Change password error', error);
          return throwError(() => error);
        })
      );
  }

  updatePerfil(request: UpdatePerfilRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/perfil`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Update perfil error', error);
          return throwError(() => error);
        })
      );
  }

  listarUsuariosOrganizacion(): Observable<UsuarioInfoResponse[]> {
    return this.http.get<UsuarioInfoResponse[]>(`${this.apiUrl}/admin/usuarios`);
  }

  crearUsuarioOrganizacion(request: CreateUsuarioOrganizacionRequest): Observable<UsuarioInfoResponse> {
    return this.http.post<UsuarioInfoResponse>(`${this.apiUrl}/admin/usuarios`, request);
  }

  actualizarUsuarioOrganizacion(id: number, request: UpdateUsuarioOrganizacionRequest): Observable<UsuarioInfoResponse> {
    return this.http.put<UsuarioInfoResponse>(`${this.apiUrl}/admin/usuarios/${id}`, request);
  }

  cambiarEstadoUsuario(id: number, activo: boolean): Observable<UsuarioInfoResponse> {
    return this.http.patch<UsuarioInfoResponse>(`${this.apiUrl}/admin/usuarios/${id}/estado?activo=${activo}`, {});
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Refresh error', error);
          this.logout();  // Si refresh falla, logout
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        next: () => console.log('Logout successful'),
        error: (err) => console.error('Logout error (pero se borra de client anyway)', err)
      });
    }
    this.clearStorageAndState();
  }

  isLoggedIn(): boolean {
    return this.getAccessToken() !== null && !this.isAccessTokenExpired();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('sgo_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('sgo_refresh_token');
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('sgo_access_token', response.access_token);
    localStorage.setItem('sgo_refresh_token', response.refresh_token);

    const userInfo: UserInfo = {
      userId: response.user_id,
      email: response.email,
      username: response.username,
      rol: response.rol,
      nombre: response.nombre,
      apellido: response.apellido,
      organizacionId: response.organizacion_id || null
    };
    localStorage.setItem('sgo_user_info', JSON.stringify(userInfo));
    this.currentUserSubject.next(userInfo);
  }

  private clearStorageAndState(): void {
    localStorage.removeItem('sgo_access_token');
    localStorage.removeItem('sgo_refresh_token');
    localStorage.removeItem('sgo_user_info');
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): void {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  private getUserFromStorage(): UserInfo | null {
    const userJson = localStorage.getItem('sgo_user_info');
    return userJson ? JSON.parse(userJson) : null;
  }

  private isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      // Parse JWT sin validar firma (solo client-side check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;  // exp está en segundos, convertir a ms
      return Date.now() > expirationTime;
    } catch (e) {
      console.error('Error parsing token expiration', e);
      return true;
    }
  }
}
