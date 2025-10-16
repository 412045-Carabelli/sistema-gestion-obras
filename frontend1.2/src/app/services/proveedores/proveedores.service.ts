import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import {Proveedor, TipoProveedor} from '../../core/models/models';
import {environment} from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.proveedores}`;
  private proveedoresCache: Proveedor[] | null = null;
  private proveedores$ = new BehaviorSubject<Proveedor[]>([]);

  constructor(private http: HttpClient) {
  }

  // ✅ Obtener todos los proveedores (con cache)
  getProveedores(forceReload = false): Observable<Proveedor[]> {
    if (this.proveedoresCache && !forceReload) {
      return of(this.proveedoresCache);
    }

    return this.http.get<Proveedor[]>(this.apiUrl).pipe(
      tap((data) => {
        this.proveedoresCache = data;
        this.proveedores$.next(data);
      })
    );
  }

  // ✅ Stream reactivo
  getProveedoresStream(): Observable<Proveedor[]> {
    return this.proveedores$.asObservable();
  }

  // ✅ Obtener proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // ✅ Crear proveedor
  createProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor).pipe(
      tap(() => this.clearCache())
    );
  }

  // ✅ Editar proveedor
  updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor).pipe(
      tap(() => this.clearCache())
    );
  }

  // ✅ Obtener tipos de proveedor
  getTipos(): Observable<TipoProveedor[]> {
    return this.http.get<TipoProveedor[]>(`${environment.apiGateway}${environment.endpoints.tipo_proveedores}`);
  }

  // ✅ Limpiar cache
  clearCache() {
    this.proveedoresCache = null;
  }
}
