import {Component, Input, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Cliente, Documento, Proveedor} from '../../../core/models/models';
import {DocumentosService} from '../../../services/documentos/documentos.service';
import {InputText} from 'primeng/inputtext';
import {FileUpload} from 'primeng/fileupload';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {Tooltip} from 'primeng/tooltip';
import {Select} from 'primeng/select';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {forkJoin} from 'rxjs';

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
    AutoCompleteModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obra-documentos.component.html',
  styleUrls: ['./obra-documentos.component.css']
})
export class ObraDocumentosComponent implements OnInit {
  @Input() obraId!: number;
  @Input() proveedores: Proveedor[] = [];
  @Input() clientes: Cliente[] = [];

  documentos: Documento[] = [];
  tiposDocumento: { label: string; value: string }[] = [];
  loading = true;
  modalVisible = false;
  selectedTipo: string | null = null;
  observacion = '';
  selectedFiles: File[] = [];
  confirmModalVisible = false;
  docAEliminar: Documento | null = null;
  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  filteredProveedores: Proveedor[] = [];
  filteredClientes: Cliente[] = [];

  constructor(
    private documentosService: DocumentosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    forkJoin({
      tipos: this.documentosService.getTiposDocumento()
    }).subscribe({
      next: ({ tipos }) => {
        this.tiposDocumento = tipos as any;
        this.loading = false;
      },
      error: () => {
        this.tiposDocumento = [];
        this.loading = false;
      }
    });
  }

  filtrarProveedores(event: any) {
    const query = event.query.toLowerCase();
    this.filteredProveedores = this.proveedores.filter(p =>
      p.nombre.toLowerCase().includes(query)
    );
  }

  filtrarClientes(event: any) {
    const query = event.query.toLowerCase();
    this.filteredClientes = this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(query)
    );
  }

  cargarDatos() {
    this.loading = true;

    const tipoAsociado =
      this.tipoEntidad === 'PROVEEDOR' && this.selectedProveedor
        ? 'PROVEEDOR'
        : this.tipoEntidad === 'CLIENTE' && this.selectedCliente
          ? 'CLIENTE'
          : null;

    const idAsociado =
      this.tipoEntidad === 'PROVEEDOR' && this.selectedProveedor
        ? this.selectedProveedor.id
        : this.tipoEntidad === 'CLIENTE' && this.selectedCliente
          ? this.selectedCliente.id
          : null;

    if (!tipoAsociado || !idAsociado) {
      this.documentos = [];
      this.loading = false;
      return;
    }

    this.documentosService.getDocumentosPorAsociado(tipoAsociado, idAsociado).subscribe({
      next: documentos => {
        this.documentos = documentos;
        this.loading = false;
      },
      error: () => {
        this.documentos = [];
        this.loading = false;
      }
    });
  }

  abrirModal() {
    this.modalVisible = true;
    this.selectedTipo = null;
    this.observacion = '';
    this.selectedFiles = [];

    // Si solo hay un cliente (el de la obra), seleccionarlo por defecto
    if (this.tipoEntidad === 'CLIENTE' && this.clientes && this.clientes.length === 1) {
      this.selectedCliente = this.clientes[0];
    }
  }

  onFileSelected(event: any) {
    this.selectedFiles = event?.files ?? [];
  }

  quitarArchivo(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  guardarDocumento() {
    if (!this.selectedFiles.length || !this.selectedTipo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Seleccioná un tipo y un archivo.'
      });
      return;
    }

    let idAsociado: number | null = null;
    let tipoAsociado: string | null = null;

    if (this.tipoEntidad === 'PROVEEDOR' && this.selectedProveedor) {
      idAsociado = this.selectedProveedor.id;
      tipoAsociado = 'PROVEEDOR';
    } else if (this.tipoEntidad === 'CLIENTE' && this.selectedCliente) {
      idAsociado = this.selectedCliente.id;
      tipoAsociado = 'CLIENTE';
    }

    const cargas = this.selectedFiles.map(file =>
      this.documentosService.uploadDocumentoFlexible(
        this.obraId,
        this.selectedTipo!,
        this.observacion ?? '',
        file,
        idAsociado,
        tipoAsociado
      ));

    forkJoin(cargas).subscribe({
      next: nuevos => {
        this.documentos = [...this.documentos, ...nuevos];
        this.modalVisible = false;
        this.selectedFiles = [];
        this.selectedTipo = null;
        this.observacion = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Documentos subidos',
          detail: `${nuevos.length} archivo(s) agregados`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron subir los documentos.'
        });
      }
    });
  }

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
        this.documentos = this.documentos.filter(d => d.id_documento !== this.docAEliminar?.id_documento);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Documento eliminado correctamente'
        });
        this.docAEliminar = null;
        this.confirmModalVisible = false;
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
