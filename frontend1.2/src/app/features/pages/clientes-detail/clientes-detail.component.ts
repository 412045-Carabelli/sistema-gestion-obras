import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {CurrencyPipe, CommonModule} from '@angular/common';

import {Cliente, CondicionIva, CONDICION_IVA_LABELS, Obra, Transaccion} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ClienteStateService} from '../../../services/clientes/clientes-state.service';
import {StyleClass} from 'primeng/styleclass';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

@Component({
  selector: 'app-clientes-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    TagModule,
    ClientesDocumentosComponent,
    CurrencyPipe,
    StyleClass,
    EstadoFormatPipe
  ],
  providers: [MessageService],
  templateUrl: './clientes-detail.component.html',
  styleUrls: ['./clientes-detail.component.css']
})
export class ClientesDetailComponent implements OnInit, OnDestroy {
  cliente!: Cliente;
  obras: Obra[] = [];
  transacciones: Transaccion[] = [];
  loading = true;

  // Estadísticas calculadas
  obrasActivas = 0;
  totalPresupuestado = 0;
  saldoPendiente = 0;
  totalCobrosCliente = 0;
  private saldoPendientePorObra = new Map<number, number>();

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private messageService: MessageService,
    private clienteStateService: ClienteStateService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.clienteStateService.clearCliente();
  }

  editarCliente() {
    this.router.navigate(['/clientes/editar', this.cliente.id]);
  }

  toggleActivo() {
    const actualizado = {...this.cliente, activo: !this.cliente.activo};
    this.clientesService.updateCliente(this.cliente.id!, actualizado).subscribe({
      next: (c) => {
        this.cliente = c;
        this.clienteStateService.setCliente(this.cliente);

        this.messageService.add({
          severity: 'success',
          summary: this.cliente.activo ? 'Cliente activado' : 'Cliente desactivado',
          detail: `El cliente fue ${this.cliente.activo ? 'activado' : 'desactivado'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del cliente.'
        });
      }
    });
  }

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id]);
  }

  irAObraDesdeMovimiento(mov: Transaccion) {
    const obraId = Number(mov?.id_obra ?? (mov as any)?.idObra ?? 0);
    if (!Number.isFinite(obraId) || obraId <= 0) return;
    this.router.navigate(['/obras', obraId], { queryParams: { tab: 2 } });
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getCondicionIvaLabel(condicion: CondicionIva | string | null | undefined): string {
    if (!condicion) return 'Sin dato';

    const normalized = condicion.toString().trim();
    const key = normalized.toUpperCase().replace(/\s+/g, '_') as CondicionIva;

    return CONDICION_IVA_LABELS[key] ?? normalized;
  }

  getEstadosResumen(): { nombre: string; cantidad: number }[] {
    if (!this.obras || this.obras.length === 0) {
      return [];
    }

    const mapa: Record<string, number> = {};

    for (const obra of this.obras) {
      const estado = obra.obra_estado || 'Sin estado';
      mapa[estado] = (mapa[estado] || 0) + 1;
    }

    return Object.entries(mapa)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  getSaldoPendienteObra(obra: Obra): number {
    const saldoDesdeApi = (obra as any)?.saldo_pendiente ?? (obra as any)?.saldoPendiente;
    if (saldoDesdeApi != null && !Number.isNaN(Number(saldoDesdeApi))) {
      return Math.max(0, Number(saldoDesdeApi));
    }
    const id = Number(obra.id);
    if (!Number.isFinite(id)) {
      return Math.max(0, Number(obra.presupuesto ?? 0));
    }

    return this.saldoPendientePorObra.get(id)
      ?? Math.max(0, Number(obra.presupuesto ?? 0));
  }

  private cargarDetalle(idCliente: number) {
    this.loading = true;

    forkJoin({
      cliente: this.clientesService.getClienteById(idCliente),
      obras: this.obrasService.getObras(),
      transacciones: this.transaccionesService.getByAsociado('CLIENTE', idCliente)
    }).subscribe({
      next: ({cliente, obras, transacciones}) => {
        this.cliente = cliente;
        this.clienteStateService.setCliente(this.cliente);

        // Filtrar obras del cliente (fallback si no vienen en el DTO)
        const obrasDto = (cliente as any)?.obras as Obra[] | undefined;
        this.obras = (obrasDto && obrasDto.length)
          ? obrasDto
          : obras.filter(o => o.cliente?.id === idCliente);

        const mapaObras = new Map<number, string>(
          this.obras
            .filter(o => o.id !== undefined)
            .map(o => [Number(o.id), o.nombre])
        );

        this.transacciones = [...(transacciones || [])]
          .map(t => ({
            ...t,
            obraNombre: t.id_obra ? mapaObras.get(Number(t.id_obra)) : undefined
          }))
          .sort((a, b) =>
            new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime()
          );

        // Calcular estadísticas
        this.calcularEstadisticas();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.clienteStateService.clearCliente();

        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar',
          detail: 'No se pudo obtener la información del cliente.'
        });
      }
    });
  }

  private calcularEstadisticas() {
    // Total de obras asociadas al cliente
    this.obrasActivas = this.obras.length;

    // Total presupuestado
    const totalDesdeApi = (this.cliente as any)?.totalCliente;
    this.totalPresupuestado = Number.isFinite(Number(totalDesdeApi))
      ? Number(totalDesdeApi)
      : this.obras.reduce((sum, obra) => sum + this.calcularPresupuestoObra(obra), 0);

    
    const cobrosPorObra = new Map<number, number>();
    const totalCobros = (this.transacciones || []).reduce((acc, t) => {
      const tipo = (t.tipo_transaccion || (t as any).tipo || '').toString().toUpperCase();
      if (tipo !== 'COBRO' && tipo !== 'INGRESO') return acc;

      const monto = Number(t.monto ?? 0);
      const obraId = Number((t as any).id_obra ?? t.id_obra);

      if (Number.isFinite(obraId)) {
        cobrosPorObra.set(obraId, (cobrosPorObra.get(obraId) ?? 0) + monto);
      }

      return acc + monto;
    }, 0);
    const cobrosDesdeApi = (this.cliente as any)?.cobrosRealizados;
    this.totalCobrosCliente = Number.isFinite(Number(cobrosDesdeApi))
      ? Number(cobrosDesdeApi)
      : totalCobros;
    const saldoDesdeApi = (this.cliente as any)?.saldoCliente;
    this.saldoPendiente = Number.isFinite(Number(saldoDesdeApi))
      ? Math.max(0, Number(saldoDesdeApi))
      : Math.max(0, this.totalPresupuestado - this.totalCobrosCliente);

    this.saldoPendientePorObra = new Map<number, number>();
    for (const obra of this.obras) {
      const id = Number(obra.id);
      if (!Number.isFinite(id)) {
        continue;
      }

      const presupuesto = this.calcularPresupuestoObra(obra);
      const cobros = cobrosPorObra.get(id) ?? 0;
      const saldoObraApi = (obra as any)?.saldo_pendiente ?? (obra as any)?.saldoPendiente;
      const saldoObra = Number.isFinite(Number(saldoObraApi))
        ? Math.max(0, Number(saldoObraApi))
        : Math.max(0, presupuesto - cobros);
      this.saldoPendientePorObra.set(id, saldoObra);
    }

  }

  private calcularPresupuestoObra(obra: Obra): number {
    if (!obra) return 0;
    const costos = obra.costos ?? [];
    if (!costos.length) {
      return Number(obra.presupuesto ?? 0);
    }

    const beneficioGlobal = obra.beneficio_global ? Number(obra.beneficio ?? 0) : null;
    const subtotalCostos = costos.reduce((acc, c) => {
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + base;
    }, 0);

    const beneficioCostos = costos.reduce((acc, c) => {
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const porc = esAdicional
        ? Number(c.beneficio ?? 0)
        : (beneficioGlobal !== null ? beneficioGlobal : Number(c.beneficio ?? 0));
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + (base * (porc / 100));
    }, 0);

    const totalConBeneficio = subtotalCostos + beneficioCostos;
    const comisionPorc = obra.tiene_comision ? Number(obra.comision ?? 0) : 0;
    return totalConBeneficio * (1 + (comisionPorc / 100));
  }
}

