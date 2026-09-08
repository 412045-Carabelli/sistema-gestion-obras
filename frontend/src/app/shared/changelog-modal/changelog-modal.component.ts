import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.19.37';
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
      modulo: 'Fixes Pablo 08/09/2026',
      icon: 'pi pi-check-circle',
      items: [
        { texto: 'Movimientos: el filtro de fecha no traía resultados fuera de la página ya cargada (el rango no llegaba al backend, se filtraba solo sobre los primeros 50 registros)', estado: 'done' },
        { texto: 'Dashboard: el gráfico "Top 5 clientes" ahora muestra el mayor monto de obras acumulado, no la deuda', estado: 'done' },
        { texto: 'Dashboard: los KPI "Cobrado"/"Pagado" excluían a clientes y proveedores que ya habían saldado su cuenta ($0)', estado: 'done' },
        { texto: 'Facturación: marcar una factura como "Cobrada" ahora genera el movimiento en cuenta corriente correspondiente (y lo borra si vuelve a "Emitida")', estado: 'done' },
        { texto: 'Obras: el botón "atrás" del navegador ya no resetea los filtros del listado', estado: 'done' },
        { texto: 'Diagrama de Gantt: las obras finalizadas ya no aparecen; al finalizar una obra, sus tareas pasan automáticamente a completadas', estado: 'done' },
        { texto: 'Obras: al pasar una obra a estado FINALIZADA, avisa si el cliente o los proveedores todavía tienen saldo pendiente', estado: 'done' },
        { texto: 'Agenda (módulo general): permite elegir obra/cliente/proveedor con filtros en cascada al crear un evento', estado: 'done' },
        { texto: 'Nueva Factura (acceso rápido del dashboard): el filtro de cliente solo muestra los que tienen obras en condiciones de facturar', estado: 'done' },
        { texto: 'Movimientos (modal dentro de una obra): el selector de proveedor solo muestra los que participan en esa obra', estado: 'done' },
        { texto: 'Nueva Tarea (acceso rápido del dashboard): se saca el campo "Nro de orden" (se asigna automático)', estado: 'done' },
        { texto: 'Agenda (listado general): se sacan las columnas ID y Fecha de Alta, se agrega vista previa de la descripción', estado: 'done' },
        { texto: 'Clientes/Proveedores: más resultados por página (8 → 20/50/100) y columnas angostas con "..." y tooltip para texto largo', estado: 'done' },
        { texto: 'Clientes: el filtro "Condición IVA" se reemplaza por un filtro de Saldo (de paso se corrigió que el mismo filtro en Proveedores nunca traía datos)', estado: 'done' },
        { texto: 'Movimientos: se renombra a "Caja/Bancos", filtros "Desde"/"Hasta", fila de subtotales (cobros/pagos/neto)', estado: 'done' },
        { texto: 'Obras: nuevo tab "Notas" — anotaciones libres, sin fecha ni relación con Agenda o Tareas', estado: 'done' },
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
