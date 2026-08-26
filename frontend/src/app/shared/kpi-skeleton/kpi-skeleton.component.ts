import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton genérico para filas de `app-kpi-card` en carga. Mismo look en toda la app:
 * `<app-kpi-skeleton [count]="4"></app-kpi-skeleton>` en vez de reinventar la grilla cada vez.
 */
@Component({
  selector: 'app-kpi-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-skeleton.component.html',
  styles: [':host { display: block; }']
})
export class KpiSkeletonComponent {
  @Input() count = 4;
  /** Columnas del grid final (md+) que este skeleton debe imitar, para que cada tarjeta ocupe el ancho real de su columna. */
  @Input() columns: 2 | 3 | 4 = 4;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  get gridClass(): string {
    switch (this.columns) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    }
  }
}
