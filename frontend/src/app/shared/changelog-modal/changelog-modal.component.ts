import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.16.0';
const STORAGE_KEY = `sgo-changelog-seen-${VERSION}`;

interface ChangeItem {
  texto: string;
  estado: 'done' | 'pending';
}

interface ChangeGroup {
  modulo: string;
  icon: string;
  items: ChangeItem[];
}

@Component({
  selector: 'app-changelog-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, TagModule],
  templateUrl: './changelog-modal.component.html',
})
export class ChangelogModalComponent implements OnInit, OnDestroy {
  visible = false;
  version = VERSION;
  private sub = new Subscription();

  grupos: ChangeGroup[] = [
    {
      modulo: 'Devolución 15/06/2026',
      icon: 'pi pi-tag',
      items: [
        { texto: 'Cuentas corrientes: saldos corregidos (presupuesto − pagos/cobros)', estado: 'done' },
        { texto: 'Cuentas corrientes: obras faltantes ahora aparecen en el export', estado: 'done' },
        { texto: 'Cuentas corrientes: export reemplazado por Excel con pivot obras × fechas', estado: 'done' },
        { texto: 'Facturas: listado con columnas de cliente y obra, estilo movimientos', estado: 'done' },
        { texto: 'Obras: filtro de estado separado en "Estado Operativo" y "Estado Financiero"', estado: 'done' },
        { texto: 'Obras: edición de memoria descriptiva directo desde el detalle', estado: 'done' },
        { texto: 'Obras: proveedores ordenados alfabéticamente al agregar un costo', estado: 'done' },
        { texto: 'Obras: corregido indicador de facturación pendiente en obras no marcadas', estado: 'done' },
        { texto: 'Agendas: quitado select de estado (eventos se crean en Pendiente)', estado: 'done' },
        { texto: 'Agendas: obras, clientes y proveedores ordenados alfabéticamente en selects', estado: 'done' },
        { texto: 'Agendas: muestra solo clientes/proveedores activos y obras no Perdidas ni Finalizadas', estado: 'done' },
      ]
    },
    {
      modulo: 'Bot WhatsApp',
      icon: 'pi pi-whatsapp',
      items: [
        { texto: 'Consulta de cuenta corriente por obra, cliente y proveedor vía WhatsApp', estado: 'done' },
        { texto: 'Notificaciones automáticas diarias de tareas por vencer (obras y agenda)', estado: 'done' },
        { texto: 'Menú interactivo con sesiones por usuario', estado: 'done' },
      ]
    },
    {
      modulo: 'Reportes / Cuentas corrientes',
      icon: 'pi pi-chart-bar',
      items: [
        { texto: 'Deudas globales ahora refleja saldos negativos (cliente pagó de más)', estado: 'done' },
        { texto: 'SP usa presupuesto efectivo con beneficio, igual que el cálculo Java', estado: 'done' },
      ]
    },
    {
      modulo: 'Cuentas corrientes',
      icon: 'pi pi-book',
      items: [
        { texto: 'En el PDF, títulos indican si corresponde a cliente o proveedor', estado: 'done' },
        { texto: 'Poder seleccionar una o varias obras para exportar el PDF', estado: 'done' },
        { texto: 'Exportar ctas. ctes. independientes de clientes o proveedores desde la pantalla de cta. cte.', estado: 'done' },
        { texto: 'Agregar el presupuesto de la obra en el PDF', estado: 'done' },
        { texto: 'PDF en formato horizontal', estado: 'done' },
        { texto: 'Indicador de cliente/proveedor y obra en el PDF', estado: 'done' },
      ]
    },
    {
      modulo: 'Facturas',
      icon: 'pi pi-file-text',
      items: [
        { texto: 'Ordenadas de más nueva a más antigua', estado: 'done' },
        { texto: 'Tamaños de letra más grandes con tooltip si sobrepasa el ancho', estado: 'done' },
        { texto: 'Factura visible en página de facturas y en pantalla de la obra', estado: 'done' },
        { texto: 'Al crear, se genera directamente como "Emitida" (sin select de estado)', estado: 'done' },
        { texto: 'Sin scroll en el modal de alta de factura', estado: 'done' },
        { texto: 'Se puede cambiar el estado de la factura (emitida ↔ cobrada) desde el listado de facturas', estado: 'done' },
      ]
    },
    {
      modulo: 'Obras',
      icon: 'pi pi-building',
      items: [
        { texto: '2 estados: Operativo (manual) y Financiero (automático por cobros y facturas)', estado: 'done' },
        { texto: 'Estado financiero: Cobrada, Cobrada parcial, Facturada, Facturada parcial, Parcial, Liquidada', estado: 'done' },
        { texto: 'Al crear una obra, redirigir directo al detalle', estado: 'done' },
        { texto: 'Obra se crea directamente en "Presupuestada" y se quita select de estado y grupo', estado: 'done' },
        { texto: 'Tab de agendas en el detalle de obra con listado y creación', estado: 'done' },
        { texto: 'Al editar observaciones, cargar las existentes correctamente', estado: 'done' },
        { texto: 'Proveedores ordenados alfabéticamente al agregar un costo', estado: 'done' },
      ]
    },
    {
      modulo: 'Agendas',
      icon: 'pi pi-calendar',
      items: [
        { texto: 'Exportar agenda a PDF', estado: 'done' },
        { texto: 'Renombrado "Nueva agenda" a "Nuevo evento"', estado: 'done' },
        { texto: 'Sin select de estado en el alta de evento', estado: 'done' },
        { texto: 'Fecha de inicio por defecto: hoy', estado: 'done' },
        { texto: 'Poder cerrar el modal de detalle de agenda', estado: 'done' },
      ]
    },
    {
      modulo: 'Movimientos',
      icon: 'pi pi-arrows-h',
      items: [
        { texto: 'Listado muestra nombre de obra y nombre de proveedor/cliente asociado', estado: 'done' },
        { texto: 'Exportar a PDF el listado de movimientos filtrados', estado: 'done' },
      ]
    },
  ];

  get totalDone(): number {
    return this.grupos.reduce((acc, g) => acc + g.items.filter(i => i.estado === 'done').length, 0);
  }

  get totalItems(): number {
    return this.grupos.reduce((acc, g) => acc + g.items.length, 0);
  }

  contarDone(items: ChangeItem[]): number {
    return items.filter(i => i.estado === 'done').length;
  }

  constructor(private changelogService: ChangelogService) {}

  ngOnInit(): void {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      this.visible = true;
    }
    this.sub.add(
      this.changelogService.abrir$.subscribe(() => this.visible = true)
    );
  }

  cerrar(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.visible = false;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
