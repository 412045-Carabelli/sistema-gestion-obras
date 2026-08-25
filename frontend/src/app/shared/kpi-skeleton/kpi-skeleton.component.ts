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
  templateUrl: './kpi-skeleton.component.html'
})
export class KpiSkeletonComponent {
  @Input() count = 4;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
