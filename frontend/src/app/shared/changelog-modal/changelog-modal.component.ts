import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.17.50';
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
      modulo: 'Fixes Pablo 28/07/2026',
      icon: 'pi pi-check-circle',
      items: [
        { texto: 'Verificar obras que muestran detalle de facturación pendiente sin estar marcadas para facturar (ej. Talar Center - Ingresos y rampas)', estado: 'done' },
        { texto: 'Cuentas Corrientes: al filtrar por proveedor, el filtro de obra ofrece solo las obras en las que participa', estado: 'done' },
        { texto: 'Verificar formato de texto al editar la memoria descriptiva de una obra', estado: 'done' },
        { texto: 'Habilitar impresión/exportación en todos los listados filtrados (ej. obras adjudicadas)', estado: 'done' },
        { texto: 'Módulo Facturas: poder revisar el PDF de una factura ya cargada', estado: 'done' },
        { texto: 'Botón "Impacta en Cta Cte" daba error: se quita', estado: 'done' },
        { texto: 'Restaurar opción COTIZADA en estados de obras', estado: 'done' },
        { texto: 'PDF de cuenta corriente (cliente + obra): respeta la obra seleccionada en vez de traer todas', estado: 'done' },
        { texto: 'Al seleccionar cliente, el filtro de obras muestra solo las obras de ese cliente', estado: 'done' },
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
