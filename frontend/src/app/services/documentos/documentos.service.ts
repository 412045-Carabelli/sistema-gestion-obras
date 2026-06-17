import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Documento} from '../../core/models/models';
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
  getTiposDocumento(): Observable<{ label: string; name: string }[]> {
    return this.http.get<{ label: string; name: string }[]>(`${environment.apiGateway}${environment.endpoints.tipo_documentos}`);
  }

  uploadDocumentoFlexible(
    idObra: number | null,
    tipoDocumento: string,
    observacion: string,
    file?: File | null,
    idAsociado?: number | null,
    tipoAsociado?: string | null
  ) {
    const formData = new FormData();
    if (idObra !== null && idObra !== undefined) {
      formData.append('id_obra', idObra.toString());
    }
    formData.append('tipo_documento', tipoDocumento);
    formData.append('observacion', observacion);
    if (idAsociado !== null && idAsociado !== undefined) {
      formData.append('id_asociado', idAsociado.toString());
    }
    if (tipoAsociado !== null && tipoAsociado !== undefined) {
      formData.append('tipo_asociado', tipoAsociado);
    }
    if (file) {
      formData.append('file', file);
    }
    console.log('📤 Payload documento:', Array.from(formData.entries()));

    return this.http.post<Documento>(`${this.apiUrl}`, formData);
  }

  getDocumentosPorAsociado(tipo: string, id: number, obraId?: number | null) {
    const suffix = obraId != null ? `?obraId=${obraId}` : '';
    return this.http.get<Documento[]>(`${this.apiUrl}/asociado/${tipo}/${id}${suffix}`);
  }

  // 🗑️ Eliminar documento
  deleteDocumento(idDocumento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idDocumento}`);
  }

  downloadDocumento(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/view`, {
      responseType: 'blob',
    });
  }

  getDocumentoUrl(id: number): string {
    return `${this.apiUrl}/${id}/view`;
  }

  uploadLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiGateway}/api/documentos/logo`, formData);
  }

}
