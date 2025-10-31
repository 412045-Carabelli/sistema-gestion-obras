import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Documento, TipoDocumento} from '../../core/models/models';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DocumentosService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.documentos}`;

  constructor(private http: HttpClient) {
  }

  // 📄 Obtener documentos de una obra
  getDocumentosByObra(idObra: number): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.apiUrl}/obra/${idObra}`);
  }

  // 📘 Obtener lista de tipos de documento
  getTiposDocumento(): Observable<TipoDocumento[]> {
    // En este caso puede venir de otro microservicio o tabla base
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/bff/tipo_documentos`);
  }

  uploadDocumentoFlexible(
    idObra: number | null,
    idTipoDocumento: number,
    observacion: string,
    file: File,
    idAsociado?: number | null,
    tipoAsociado?: string | null
  ) {
    const formData = new FormData();
    if (idObra) formData.append('id_obra', idObra.toString());
    formData.append('id_tipo_documento', idTipoDocumento.toString());
    formData.append('observacion', observacion);
    if (idAsociado) formData.append('id_asociado', idAsociado.toString());
    if (tipoAsociado) formData.append('tipo_asociado', tipoAsociado);
    formData.append('file', file);

    return this.http.post<Documento>(`${this.apiUrl}`, formData);
  }

  getDocumentosPorAsociado(tipo: string, id: number) {
    return this.http.get<Documento[]>(`${this.apiUrl}/asociado/${tipo}/${id}`);
  }

  // 🗑️ Eliminar documento
  deleteDocumento(idDocumento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idDocumento}`);
  }

  downloadDocumento(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
    });
  }

}
