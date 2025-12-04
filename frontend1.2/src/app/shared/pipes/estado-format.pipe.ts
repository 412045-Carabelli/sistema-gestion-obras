import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'estadoFormat',
  standalone: true
})
export class EstadoFormatPipe implements PipeTransform {
  transform(value: unknown): string {
    let raw = '';

    if (typeof value === 'string') {
      raw = value;
    } else if (value && typeof value === 'object') {
      const candidate = (value as any).nombre ?? (value as any).label ?? (value as any).name;
      raw = typeof candidate === 'string' ? candidate : '';
    }

    if (!raw) return '';

    const normalized = raw.replace(/_/g, ' ').toLowerCase().trim();
    if (!normalized) return '';

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
