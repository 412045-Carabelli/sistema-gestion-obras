import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportarListadoPdfOpciones {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
  nombreArchivo: string;
  /** Texto corto describiendo los filtros aplicados, ej. "Estado: En progreso" */
  subtitulo?: string;
}

/** Genera y descarga un PDF tabular de un listado ya filtrado (mismas filas que ve el usuario en pantalla). */
export function exportarListadoPdf(opciones: ExportarListadoPdfOpciones): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const ml = 14;
  const hoyDisplay = new Date().toLocaleDateString('es-AR');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(opciones.titulo, ml, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const detalle = `Generado el ${hoyDisplay}${opciones.subtitulo ? ' · ' + opciones.subtitulo : ''} · ${opciones.filas.length} registro(s)`;
  doc.text(detalle, ml, 21);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 26,
    head: [opciones.columnas],
    body: opciones.filas,
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: ml, right: ml }
  });

  const hoyIso = new Date().toISOString().split('T')[0];
  doc.save(`${opciones.nombreArchivo}-${hoyIso}.pdf`);
}
