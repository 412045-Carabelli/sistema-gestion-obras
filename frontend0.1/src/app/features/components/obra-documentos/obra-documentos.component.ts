import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Documento, TipoDocumento } from '../../../core/models/models';
import { DocumentosService } from '../../../services/documentos/documentos.service';
import { InputText } from 'primeng/inputtext';
import { FileUpload } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {Tooltip} from 'primeng/tooltip';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-obra-documentos',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    FormsModule,
    DatePipe,
    InputText,
    FileUpload,
    ConfirmDialogModule,
    Tooltip,
    Select,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obra-documentos.component.html',
  styleUrls: ['./obra-documentos.component.css'],
})
export class ObraDocumentosComponent implements OnInit {
  @Input() obraId!: number;

  documentos: Documento[] = [];
  tiposDocumento: TipoDocumento[] = [];
  loading = true;

  // 📄 modal
  modalVisible = false;
  selectedTipo: number | null = null;
  observacion = '';
  selectedFile: File | null = null;

  constructor(
    private documentosService: DocumentosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.documentosService.getDocumentosByObra(this.obraId).subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.documentosService.getTiposDocumento().subscribe((tipos) => {
      this.tiposDocumento = tipos;
    });
  }

  abrirModal() {
    this.modalVisible = true;
    this.selectedTipo = null;
    this.observacion = '';
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    if (event && event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  quitarArchivo() {
    this.selectedFile = null;
  }

  guardarDocumento() {
    if (!this.selectedFile || !this.selectedTipo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Seleccioná un tipo y un archivo.',
      });
      return;
    }

    this.documentosService
      .uploadDocumento(
        this.obraId,
        this.selectedTipo,
        this.observacion ?? '',
        this.selectedFile
      )
      .subscribe({
        next: (nuevo) => {
          // 🔁 Actualizamos la lista sin refrescar la página
          this.documentos = [...this.documentos, nuevo];

          // ✅ Cerramos el modal y limpiamos
          this.modalVisible = false;
          this.selectedFile = null;
          this.selectedTipo = null;
          this.observacion = '';

          // 🟢 Notificación de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Documento subido',
            detail: nuevo.nombre_archivo,
          });
        },
        error: (err) => {
          console.error('Error subiendo documento', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo subir el documento.',
          });
        },
      });
  }

  confirmModalVisible = false;
  docAEliminar: Documento | null = null;

  eliminarDocumento(doc: Documento) {
    this.docAEliminar = doc;
    this.confirmModalVisible = true;
  }

  cancelarEliminacion() {
    this.docAEliminar = null;
    this.confirmModalVisible = false;
  }

  confirmarEliminacion() {
    if (!this.docAEliminar) return;

    this.documentosService.deleteDocumento(this.docAEliminar.id_documento).subscribe({
      next: () => {
        this.documentos = this.documentos.filter(
          (d) => d.id_documento !== this.docAEliminar?.id_documento
        );

        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Documento eliminado correctamente',
        });

        this.docAEliminar = null;
        this.confirmModalVisible = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el documento.',
        });
      },
    });
  }


  descargarDocumento(doc: Documento) {
    this.documentosService.downloadDocumento(doc.id_documento).subscribe({
      next: (fileBlob) => {
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
          detail: doc.nombre_archivo,
        });
      },
      error: (err) => {
        console.error('Error descargando documento', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el documento.',
        });
      },
    });
  }

}
