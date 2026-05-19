import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LayoutHeaderType = 'list' | 'detail' | 'create' | 'edit';

@Component({
  selector: 'app-layout-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-header.component.html'
})
export class LayoutHeaderComponent {
  @Input({ required: true }) type: LayoutHeaderType = 'list';
  @Input({ required: true }) title: string = '';
  @Input() subtitle?: string;

  get gradientClass(): string {
    const map: Record<LayoutHeaderType, string> = {
      list: 'from-blue-600 to-blue-800',
      detail: 'from-amber-500 to-amber-700',
      create: 'from-green-600 to-green-700',
      edit: 'from-red-600 to-red-700'
    };
    return map[this.type];
  }

  get subtitleColorClass(): string {
    const map: Record<LayoutHeaderType, string> = {
      list: 'text-blue-100',
      detail: 'text-amber-100',
      create: 'text-green-100',
      edit: 'text-red-100'
    };
    return map[this.type];
  }
}
