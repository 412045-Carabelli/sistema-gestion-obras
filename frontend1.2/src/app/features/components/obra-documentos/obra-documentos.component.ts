import {Component, Input, OnInit, ViewChild} from '@angular/core';
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
  @ViewChild('documentFileUpload') documentFileUpload?: FileUpload;

  documentos: Documento[] = [];
  tiposDocumento: { label: string; value: string }[] = [];
  loading = true;
  modalVisible = false;
  selectedTipo: string = 'FACTURA';
  observacion = '';
  selectedFiles: File[] = [];
  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  filteredProveedores: Proveedor[] = [];
  filteredClientes: Cliente[] = [];

  constructor(
    private documentosService: DocumentosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    forkJoin({
      tipos: this.documentosService.getTiposDocumento()
    }).subscribe({
      next: ({ tipos }) => {
        // El selector usa optionLabel="label" y optionValue="value": normalizamos aquí
        this.tiposDocumento = (tipos as any)?.map((t: any) => ({
          label: t.label ?? t.nombre ?? t.name ?? t.value,
          value: t.value ?? t.name ?? t.id ?? t.label
        })) ?? [];
        this.cargarDocumentosObra();
      },
      error: () => {
        this.tiposDocumento = [];
        this.cargarDocumentosObra();
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
      this.cargarDocumentosObra();
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

  private cargarDocumentosObra() {
    if (!this.obraId) {
      this.documentos = [];
      this.loading = false;
      return;
    }
    this.documentosService.getDocumentosByObra(this.obraId).subscribe({
      next: documentos => {
        this.documentos = documentos || [];
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
    this.observacion = '';
    this.selectedFiles = [];
    this.documentFileUpload?.clear();

    // Si solo hay un cliente (el de la obra), seleccionarlo por defecto
    if (this.tipoEntidad === 'CLIENTE' && this.clientes && this.clientes.length === 1) {
      this.selectedCliente = this.clientes[0];
    }
  }

  onFileSelected(event: any) {
    // FileUpload limpia el input luego del select, por eso copiamos los files en un array propio
    const fromEvent = event?.currentFiles ?? event?.files ?? [];
    this.selectedFiles = Array.isArray(fromEvent) ? [...fromEvent] : Array.from(fromEvent);
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

    let idAsociado: number
    let tipoAsociado: string

    if (this.tipoEntidad === 'PROVEEDOR') {
      if (!this.selectedProveedor) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Falta proveedor',
          detail: 'Seleccioná un proveedor para asociar el documento.'
        });
        return;
      }
      idAsociado = this.selectedProveedor.id;
      tipoAsociado = 'PROVEEDOR';
    } else {
      if (!this.selectedCliente) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Falta cliente',
          detail: 'Seleccioná un cliente para asociar el documento.'
        });
        return;
      }
      idAsociado = this.selectedCliente.id;
      tipoAsociado = 'CLIENTE';
    }

    console.log('🚀 Subir documento', {
      obraId: this.obraId,
      selectedTipo: this.selectedTipo,
      idAsociado,
      tipoAsociado,
      archivos: this.selectedFiles.map(f => f.name)
    });

    const cargas = this.selectedFiles.map(file =>
      this.documentosService.uploadDocumentoFlexible(
        this.obraId,
        this.selectedTipo,
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
        this.documentFileUpload?.clear();
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

