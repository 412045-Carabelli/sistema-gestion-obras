import {Component, Input, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {Tooltip} from 'primeng/tooltip';
import {MessageService} from 'primeng/api';
import {DocumentosService} from '../../../services/documentos/documentos.service';
import {Documento} from '../../../core/models/models';
import {ProgressSpinner} from 'primeng/progressspinner';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

@Component({
  selector: 'app-clientes-documentos',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToastModule,
    Tooltip,
    DatePipe,
    ProgressSpinner,
    EstadoFormatPipe
  ],
  providers: [MessageService],
  templateUrl: './clientes-documentos.component.html',
  styleUrls: ['./clientes-documentos.component.css']
})
export class ClientesDocumentosComponent implements OnInit {
  @Input() clienteId?: number;
  @Input() asociadoId?: number;
  @Input() tipoAsociado: 'CLIENTE' | 'PROVEEDOR' = 'CLIENTE';

  documentos: Documento[] = [];
  loading = true;

  constructor(
    private documentosService: DocumentosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.asociadoId ?? this.clienteId;
    if (id) this.cargarDocumentos(id);
  }

  cargarDocumentos(id: number) {
    this.loading = true;
    this.documentosService.getDocumentosPorAsociado(this.tipoAsociado, id).subscribe({
      next: docs => {
        console.log(docs)
        this.documentos = docs;
        this.loading = false;
      },
      error: () => {
        this.documentos = [];
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los documentos del cliente.'
        });
      }
    });
  }

  descargarDocumento(doc: Documento) {
    this.documentosService.downloadDocumento(doc.id_documento).subscribe({
      next: fileBlob => {
        const blob = new Blob([fileBlob]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nombre_archivo || 'documento';
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga iniciada',
          detail: doc.nombre_archivo
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el documento.'
        });
      }
    });
  }
}
