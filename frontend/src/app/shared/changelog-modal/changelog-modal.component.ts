import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.17.45';
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
      modulo: 'UI Refinements 14/07/2026',
      icon: 'pi pi-palette',
      items: [
        { texto: 'Memoria descriptiva de obra: mostrar como texto plano (sin tags HTML)', estado: 'done' },
        { texto: 'Botón de impresión en todos los listados (obras, clientes, proveedores, agendas, facturas, movimientos, cuentas corrientes)', estado: 'done' },
        { texto: 'Botón "Ver" para abrir PDF de facturas adjuntas', estado: 'done' },
      ]
    },
    {
      modulo: 'Cuentas Corrientes 14/07/2026',
      icon: 'pi pi-book',
      items: [
        { texto: 'Agregar estado COTIZADA a obras', estado: 'done' },
        { texto: 'Mapear estados de obras a colores en listado', estado: 'done' },
        { texto: 'Botón de descarga para documentos adjuntos en facturas', estado: 'done' },
        { texto: 'Optimizar catálogo de cuentas corrientes con queries directas a BD', estado: 'done' },
        { texto: 'Al filtrar por obra(s), mostrar proveedores de esa(s) obra(s)', estado: 'done' },
        { texto: 'Al filtrar por obra(s), mostrar clientes de esa(s) obra(s)', estado: 'done' },
        { texto: 'Incluir todas las obras activas en catálogo (sin filtro de estado)', estado: 'done' },
        { texto: 'Soportar múltiples obras seleccionadas en filtros de cuentas corrientes', estado: 'done' },
      ]
    },
    {
      modulo: 'Cuentas Corrientes 14/07/2026 (2)',
      icon: 'pi pi-book',
      items: [
        { texto: 'Corregir performance de listado de obras (N+1 queries de costos)', estado: 'done' },
        { texto: 'Corregir performance de transacciones activas (N+1 llamadas a obras-service)', estado: 'done' },
        { texto: 'PDF de cuenta corriente: incluir obras sin cobros/pagos registrados', estado: 'done' },
        { texto: 'Sincronizar export de PDF/Excel con las obras reales de cada cliente/proveedor', estado: 'done' },
      ]
    },
    {
      modulo: 'Cuentas Corrientes 15/07/2026',
      icon: 'pi pi-book',
      items: [
        { texto: 'Corregir condición de carrera al exportar PDF/Excel con filtros recién cambiados', estado: 'done' },
        { texto: 'Export de cuenta corriente pide datos frescos en vez de usar caché desactualizado', estado: 'done' },
        { texto: 'Corregir ruta del gateway que ignoraba el filtro de obra en cuenta corriente proveedor', estado: 'done' },
        { texto: 'Unificar estados válidos de obra en cuentas corrientes (COTIZADA/ADJUDICADA/EN_PROGRESO/FINALIZADA)', estado: 'done' },
        { texto: 'Corregir bases de datos dev/prod cruzadas en SPs de deudas y filtros en cascada', estado: 'done' },
        { texto: 'Corregir catálogo de obras que no filtraba por estado ni por base correcta en dev', estado: 'done' },
      ]
    },
    {
      modulo: 'Listados 15/07/2026',
      icon: 'pi pi-list',
      items: [
        { texto: 'Reemplazar botón de imprimir por "Exportar PDF" en la barra de filtros (obras, clientes, proveedores, agendas, facturas, movimientos)', estado: 'done' },
        { texto: 'El PDF exportado respeta los filtros aplicados en el listado', estado: 'done' },
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
