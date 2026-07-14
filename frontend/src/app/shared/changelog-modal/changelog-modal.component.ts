import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.17.41';
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
