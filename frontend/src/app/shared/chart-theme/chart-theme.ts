/**
 * Tema compartido para gráficos PrimeNG/Chart.js (reportes + dashboard).
 * Paleta y specs de la skill de dataviz interna: orden categórico fijo,
 * validado contra CVD, más helpers de fuente/grilla/tooltip consistentes
 * con el resto de la app (que renderiza en el sans-serif del sistema —
 * 'Poppins' nunca estuvo cargado como @font-face/Google Font).
 */

export const CHART_FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export const CHART_INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#6b6a63',
  grid: '#d4d3c9',
  axis: '#a8a79b',
};

/** Azul secuencial (una sola familia de hue, más oscuro = "lo real/cobrado"). */
export const CHART_BLUE = {
  light: '#9ec5f4',
  base: '#2a78d6',
  dark: '#184f95',
};

/** Par divergente: positivo (entradas) vs negativo (salidas). */
export const CHART_DIVERGING = {
  positive: '#2a78d6',
  negative: '#e34948',
};

/** Orden categórico fijo (nunca ciclar/regenerar) — hasta 8 series. */
export const CHART_CATEGORICAL = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

export function chartFont(size = 11, weight?: string): any {
  return weight ? { family: CHART_FONT_FAMILY, size, weight } : { family: CHART_FONT_FAMILY, size };
}

export function formatARSCompact(value: number): string {
  return '$' + Number(value ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function chartLegend(position: 'top' | 'bottom' = 'top'): any {
  return {
    position,
    labels: {
      font: chartFont(12),
      color: CHART_INK.secondary,
      padding: 12,
      usePointStyle: true,
      boxWidth: 8,
      boxHeight: 8,
    }
  };
}

export function chartTooltip(): any {
  return {
    backgroundColor: '#ffffff',
    titleColor: CHART_INK.primary,
    bodyColor: CHART_INK.secondary,
    borderColor: CHART_INK.grid,
    borderWidth: 1,
    titleFont: chartFont(12, '600'),
    bodyFont: chartFont(12),
    padding: 10,
    boxPadding: 4,
    callbacks: {
      label: (ctx: any) => {
        const val = ctx.parsed?.y ?? ctx.parsed?.x ?? ctx.parsed ?? 0;
        return ` ${ctx.dataset.label ?? ''}: ${formatARSCompact(val)}`.trim();
      }
    }
  };
}

/** Escala monetaria recesiva (grilla hairline, ejes mutados, sin fuente Poppins inexistente). */
export function chartMoneyScale(axis: 'x' | 'y' = 'y'): any {
  return {
    ticks: {
      font: chartFont(11),
      color: CHART_INK.muted,
      callback: (v: any) => formatARSCompact(Number(v)),
    },
    grid: { color: CHART_INK.grid, drawTicks: false },
    border: { color: CHART_INK.axis },
  };
}

export function chartCategoryScale(): any {
  return {
    ticks: { font: chartFont(11), color: CHART_INK.muted },
    grid: { display: false },
    border: { color: CHART_INK.axis },
  };
}
