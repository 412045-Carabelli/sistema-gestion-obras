import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton genérico para cualquier tabla en carga. Mismo look en toda la app:
 * `<app-table-skeleton [rows]="5"></app-table-skeleton>` en vez de reinventar el
 * bloque de barras cada vez.
 */
@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-skeleton.component.html',
  styles: [':host { display: block; }']
})
export class TableSkeletonComponent {
  @Input() rows = 6;

  get filas(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
