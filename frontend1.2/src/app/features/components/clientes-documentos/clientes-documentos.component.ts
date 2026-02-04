import {Component, Input, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {Tooltip} from 'primeng/tooltip';
import {ConfirmationService, MessageService} from 'primeng/api';
import {DocumentosService} from '../../../services/documentos/documentos.service';
import {Documento} from '../../../core/models/models';
import {ProgressSpinner} from 'primeng/progressspinner';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ConfirmDialogModule} from 'primeng/confirmdialog';

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
    EstadoFormatPipe,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
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
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
    const popup = this.abrirPopup();
    if (!popup) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Bloqueo de ventana',
        detail: 'Habilita los pop-ups para abrir el documento.'
      });
      return;
    }
    this.documentosService.downloadDocumento(doc.id_documento).subscribe({
      next: fileBlob => {
        const baseBlob = fileBlob instanceof Blob ? fileBlob : new Blob([fileBlob]);
        const tipo = this.detectarMime(doc.nombre_archivo, baseBlob.type);
        const blob = tipo ? new Blob([baseBlob], { type: tipo }) : baseBlob;
        const url = window.URL.createObjectURL(blob);
        popup.location.href = url;
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        this.messageService.add({
          severity: 'success',
          summary: 'Apertura iniciada',
          detail: doc.nombre_archivo
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo abrir el documento.'
        });
      }
    });
  }

  eliminarDocumento(doc: Documento) {
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: `¿Seguro que queres eliminar el documento ${doc.nombre_archivo}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.documentosService.deleteDocumento(doc.id_documento).subscribe({
          next: () => {
            this.documentos = this.documentos.filter(d => d.id_documento !== doc.id_documento);
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Documento eliminado correctamente'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el documento.'
            });
          }
        });
      }
    });
  }

  private abrirPopup(): Window | null {
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.write('<p>Cargando documento...</p>');
    }
    return popup;
  }

  private detectarMime(nombre?: string, baseType?: string): string | null {
    if (baseType) return baseType;
    if (!nombre) return null;
    const lower = nombre.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return null;
  }
}
