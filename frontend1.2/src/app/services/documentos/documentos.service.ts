import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Documento, TipoDocumento} from '../../core/models/models';
import {Observable} from 'rxjs';
import {environment} from '../../../enviroments/enviroment';

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
    return this.http.get<TipoDocumento[]>(`http://localhost:8080/bff/tipo_documentos`);
  }

  // 📂 Crear un documento
  uploadDocumento(
    idObra: number,
    idTipoDocumento: number,
    observacion: string,
    file: File
  ) {
    const formData = new FormData();

    formData.append('id_obra', idObra.toString());
    formData.append('id_tipo_documento', idTipoDocumento.toString());
    formData.append('observacion', observacion ?? '');
    formData.append('file', file, file.name);

    console.log('📤 FormData que se envía:', formData.get('id_obra'), formData.get('file'));

    return this.http.post<Documento>(
      `${this.apiUrl}`,
      formData
    );
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
