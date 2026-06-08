import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

const VERSION = 'v1.2.4';
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
export class ChangelogModalComponent implements OnInit {
  visible = false;
  version = VERSION;

  grupos: ChangeGroup[] = [
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
      ]
    },
    {
      modulo: 'Obras',
      icon: 'pi pi-building',
      items: [
        { texto: '2 estados: Administrativo (automático) y Operativo (manual)', estado: 'done' },
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

  ngOnInit(): void {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      this.visible = true;
    }
  }

  cerrar(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.visible = false;
  }
}
