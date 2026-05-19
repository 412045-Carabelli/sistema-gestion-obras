import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

interface ColorMap {
  border: string;
  text: string;
}

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
  @Input() color: 'emerald' | 'blue' | 'rose' | 'amber' | 'green' | 'red' = 'emerald';
  @Input() value: string | number | null = null;
  @Input() tooltip?: string;

  private colorMap: Record<string, ColorMap> = {
    emerald: { border: '#10b981', text: '#047857' },
    blue: { border: '#3b82f6', text: '#1d4ed8' },
    rose: { border: '#f43f5e', text: '#be185d' },
    amber: { border: '#f59e0b', text: '#b45309' },
    green: { border: '#22c55e', text: '#15803d' },
    red: { border: '#ef4444', text: '#991b1b' }
  };

  get borderColor(): string {
    return this.colorMap[this.color]?.border || '#6b7280';
  }

  get textColor(): string {
    return this.colorMap[this.color]?.text || '#374151';
  }
}
