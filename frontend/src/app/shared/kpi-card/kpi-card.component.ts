import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

interface ColorMap {
  border: string;
  text: string;
  bgTint: string;
}

export type KpiCardColor = 'emerald' | 'blue' | 'rose' | 'amber' | 'green' | 'red' | 'indigo' | 'violet' | 'gray';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.css']
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() description?: string;
  @Input() color: KpiCardColor = 'emerald';
  @Input() value: string | number = '';
  @Input() tooltip?: string;
  @Input() minHeight: number = 0;
  @Input() valueFontSize: number = 24;
  /** Clase de ícono PrimeIcons (ej. 'pi pi-wallet'), opcional. Mismo estilo que los KPI de Reportes. */
  @Input() icon?: string;
  /** Tiñe el fondo de la tarjeta con el tono claro del color (ej. estados tipo "Resultado" positivo/negativo). */
  @Input() tinted = false;

  private colorMap: Record<KpiCardColor, ColorMap> = {
    emerald: { border: '#059669', text: '#047857', bgTint: '#ecfdf5' },
    blue: { border: '#2563eb', text: '#1d4ed8', bgTint: '#eff6ff' },
    rose: { border: '#e11d48', text: '#be123c', bgTint: '#fff1f2' },
    amber: { border: '#d97706', text: '#b45309', bgTint: '#fffbeb' },
    green: { border: '#16a34a', text: '#15803d', bgTint: '#f0fdf4' },
    red: { border: '#dc2626', text: '#b91c1c', bgTint: '#fef2f2' },
    indigo: { border: '#4f46e5', text: '#4338ca', bgTint: '#eef2ff' },
    violet: { border: '#7c3aed', text: '#6d28d9', bgTint: '#f5f3ff' },
    gray: { border: '#6b7280', text: '#374151', bgTint: '#f9fafb' }
  };

  get borderColor(): string {
    return this.colorMap[this.color]?.border || '#6b7280';
  }

  get textColor(): string {
    return this.colorMap[this.color]?.text || '#374151';
  }

  get backgroundColor(): string {
    return this.tinted ? (this.colorMap[this.color]?.bgTint || '#f9fafb') : '#ffffff';
  }
}
