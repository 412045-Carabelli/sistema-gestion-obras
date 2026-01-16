import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {forkJoin, of, Subscription, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {TagModule} from 'primeng/tag';

import {Cliente, Factura, Obra, Transaccion} from '../../../core/models/models';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {FacturasStateService} from '../../../services/facturas/facturas-state.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';

@Component({
  selector: 'app-facturas-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    CurrencyPipe,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-detail.component.html',
  styleUrls: ['./facturas-detail.component.css']
})
export class FacturasDetailComponent implements OnInit, OnDestroy {
  factura?: Factura;
  cliente?: Cliente;
  obra: Obra | null = null;
  facturasObra: Factura[] = [];
  cobrosObra = 0;
  previewUrl?: string;
  loading = true;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private facturasStateService: FacturasStateService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarDetalle(id);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.facturasStateService.clearFactura();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  cargarDetalle(id: number) {
    this.loading = true;
    this.subs.add(
      this.facturasService.getFacturaById(id).pipe(
        switchMap(factura => {
          const obraId = factura.id_obra;
          return forkJoin({
            factura: of(factura),
            cliente: this.clientesService.getClienteById(factura.id_cliente),
            obra: obraId ? this.obrasService.getObraById(obraId) : of(null),
            facturasObra: obraId ? this.facturasService.getFacturasByObra(obraId) : of([]),
            movimientos: obraId ? this.transaccionesService.getByObra(obraId) : of([])
          });
        })
      ).subscribe({
        next: ({factura, cliente, obra, facturasObra, movimientos}) => {
          this.factura = {
            ...factura,
            cliente_nombre: cliente?.nombre,
            obra_nombre: obra?.nombre
          };
          this.cliente = cliente;
          this.obra = obra;
          this.facturasObra = facturasObra || [];
          this.cobrosObra = (movimientos || [])
            .filter(m => this.esCobro(m))
            .reduce((sum, m) => sum + Number(m.monto || 0), 0);
          this.facturasStateService.setFactura(factura);
          this.cargarPreview();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la factura.'
          });
        }
      })
    );
  }

  descargarAdjunto() {
    if (!this.factura?.id || !this.factura?.nombre_archivo) return;
    const popup = this.abrirPopup();
    if (!popup) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Bloqueo de ventana',
        detail: 'Habilita los pop-ups para abrir el adjunto.'
      });
      return;
    }
    this.facturasService.downloadFactura(this.factura.id).subscribe({
      next: (blob) => {
        const baseBlob = blob instanceof Blob ? blob : new Blob([blob]);
        const tipo = this.detectarMime(this.factura?.nombre_archivo, baseBlob.type);
        const fileBlob = tipo ? new Blob([baseBlob], { type: tipo }) : baseBlob;
        const url = window.URL.createObjectURL(fileBlob);
        popup.location.href = url;
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo abrir el adjunto.'
        });
      }
    });
  }

  descargarAdjuntoArchivo() {
    if (!this.factura?.id || !this.factura?.nombre_archivo) return;
    const nombre = this.factura.nombre_archivo;
    this.facturasService.downloadFactura(this.factura.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = nombre;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el adjunto.'
        });
      }
    });
  }

  editarFactura() {
    if (!this.factura?.id) return;
    this.router.navigate(['/facturas/editar', this.factura.id]);
  }

  eliminarFactura() {
    if (!this.factura?.id) return;
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: `¿Estas seguro de eliminar la factura #${this.factura.id}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.facturasService.deleteFactura(this.factura!.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Factura eliminada',
              detail: 'La factura se elimino correctamente.'
            });
            this.router.navigate(['/facturas']);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la factura.'
            });
          }
        });
      }
    });
  }

  get montoCobrado(): number {
    return this.cobrosObra;
  }

  get estadoLabel(): string {
    return this.totalPorCobrar <= 0 ? 'Pagada' : 'Pendiente';
  }

  get totalPresupuesto(): number {
    return Number(this.obra?.presupuesto || 0);
  }

  get totalFacturado(): number {
    return this.facturasObra.reduce((sum, f) => sum + Number(f.monto || 0), 0);
  }

  get totalPorCobrar(): number {
    return Math.max(0, this.totalPresupuesto - this.totalFacturado);
  }

  get saldoFinal(): number {
    return this.totalFacturado - this.totalPresupuesto;
  }

  private cargarPreview() {
    if (!this.factura?.id || !this.isImageFile(this.factura.nombre_archivo)) {
      return;
    }
    this.facturasService.downloadFactura(this.factura.id).subscribe(blob => {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewUrl = URL.createObjectURL(blob);
    });
  }

  protected isImageFile(nombre?: string): boolean {
    if (!nombre) return false;
    return /\.(jpg|jpeg|png)$/i.test(nombre);
  }

  protected isPdfFile(nombre?: string): boolean {
    if (!nombre) return false;
    return /\.pdf$/i.test(nombre);
  }

  private abrirPopup(): Window | null {
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.write('<p>Cargando adjunto...</p>');
    }
    return popup;
  }

  private detectarMime(nombre?: string, baseType?: string | null): string | null {
    if (baseType) return baseType;
    if (!nombre) return null;
    const lower = nombre.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return null;
  }

  private esCobro(mov: Transaccion): boolean {
    const raw: any = (mov as any).tipo_transaccion ?? (mov as any).tipo_movimiento ?? (mov as any).tipo;
    if (typeof raw === 'string') return raw.toUpperCase().includes('COBRO');
    if (raw && typeof raw.id === 'number') return raw.id === 1;
    const nombre = (raw?.nombre || '').toString().toUpperCase();
    return nombre.includes('COBRO');
  }
}
