import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Cliente,
  FlujoCajaResponse,
  IngresosEgresosResponse,
  Obra,
  ObraCosto,
  PendientesResponse,
  Proveedor,
  ResumenGeneralResponse,
  Tarea,
  Transaccion
} from '../../core/models/models';

interface ReportPayload {
  resumen?: ResumenGeneralResponse | null;
  ingresosEgresos?: IngresosEgresosResponse | null;
  flujoCaja?: FlujoCajaResponse | null;
  pendientes?: PendientesResponse | null;
}

@Injectable({providedIn: 'root'})
export class ExportService {
  private logoPromise?: Promise<string>;
  private readonly excelMime = 'application/vnd.ms-excel;charset=utf-8;';

  constructor(private http: HttpClient) {}

  async exportClienteDetallePdf(
    cliente: Cliente,
    obras: Obra[],
    tareas: Array<Tarea & { obraNombre?: string }>,
    movimientosPendientes: Transaccion[]
  ): Promise<void> {
    const {doc, startY} = await this.createBrandedPdf(`Resumen del cliente ${cliente.nombre}`);
    let y = startY;

    y = this.drawInfoBlock(doc, y, 'Datos del cliente', [
      ['Nombre', cliente.nombre],
      ['Contacto', cliente.contacto || '—'],
      ['CUIT', cliente.cuit || '—'],
      ['Teléfono', cliente.telefono || '—'],
      ['Email', cliente.email || '—']
    ]);

    y = this.drawTable(
      doc,
      y,
      'Obras asignadas',
      ['Nombre', 'Estado', 'Inicio', 'Fin', 'Presupuesto'],
      obras.map((obra) => [
        obra.nombre,
        obra.obra_estado || '—',
        this.formatDate(obra.fecha_inicio),
        this.formatDate(obra.fecha_fin),
        this.formatCurrency(obra.presupuesto)
      ])
    );

    y = this.drawTable(
      doc,
      y,
      'Tareas activas',
      ['Obra', 'Tarea', 'Estado', 'Inicio', 'Fin'],
      tareas.map((t) => [
        t.obraNombre || '—',
        t.nombre,
        t.estado_tarea,
        this.formatDate(t.fecha_inicio),
        this.formatDate(t.fecha_fin)
      ])
    );

    this.drawTable(
      doc,
      y,
      'Movimientos pendientes',
      ['Fecha', 'Tipo', 'Monto', 'Forma de pago', 'Obra'],
      movimientosPendientes.map((mov) => [
        this.formatDate(mov.fecha as any),
        mov.tipo_transaccion,
        this.formatCurrency(mov.monto),
        mov.forma_pago || '—',
        mov.id_obra ? `Obra #${mov.id_obra}` : '—'
      ])
    );

    doc.save(`cliente-${cliente.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

  async exportProveedorDetallePdf(
    proveedor: Proveedor,
    obrasAsignadas: Obra[],
    tareas: Tarea[],
    movimientosPendientes: Transaccion[]
  ): Promise<void> {
    const {doc, startY} = await this.createBrandedPdf(`Resumen del proveedor ${proveedor.nombre}`);
    let y = startY;

    y = this.drawInfoBlock(doc, y, 'Datos del proveedor', [
      ['Nombre', proveedor.nombre],
      ['Tipo', this.capitalize((proveedor.tipo_proveedor || '').replace(/_/g, ' '))],
      ['Contacto', proveedor.contacto || '—'],
      ['Teléfono', proveedor.telefono || '—'],
      ['Email', proveedor.email || '—']
    ]);

    y = this.drawTable(
      doc,
      y,
      'Obras vinculadas',
      ['Nombre', 'Estado', 'Inicio', 'Fin', 'Cliente'],
      obrasAsignadas.map((obra) => [
        obra.nombre,
        obra.obra_estado || '—',
        this.formatDate(obra.fecha_inicio),
        this.formatDate(obra.fecha_fin),
        obra.cliente?.nombre || '—'
      ])
    );

    y = this.drawTable(
      doc,
      y,
      'Tareas asignadas',
      ['Obra', 'Tarea', 'Estado', 'Inicio', 'Fin'],
      tareas.map((t) => [
        `Obra #${t.id_obra}`,
        t.nombre,
        t.estado_tarea,
        this.formatDate(t.fecha_inicio),
        this.formatDate(t.fecha_fin)
      ])
    );

    this.drawTable(
      doc,
      y,
      'Movimientos pendientes',
      ['Fecha', 'Tipo', 'Monto', 'Forma de pago', 'Obra'],
      movimientosPendientes.map((mov) => [
        this.formatDate(mov.fecha as any),
        mov.tipo_transaccion,
        this.formatCurrency(mov.monto),
        mov.forma_pago || '—',
        mov.id_obra ? `Obra #${mov.id_obra}` : '—'
      ])
    );

    doc.save(`proveedor-${proveedor.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

  async exportObraPresupuestoPdf(obra: Obra, costos: ObraCosto[]): Promise<void> {
    const {doc, startY} = await this.createBrandedPdf(`Presupuesto - ${obra.nombre}`);
    let y = startY;

    const cliente = obra.cliente;
    y = this.drawInfoBlock(doc, y, 'Datos de la obra', [
      ['Obra', obra.nombre],
      ['Dirección', obra.direccion || '—'],
      ['Cliente', cliente?.nombre || '—'],
      ['CUIT', cliente?.cuit || '—'],
      ['Email', cliente?.email || '—'],
      ['Fecha inicio', this.formatDate(obra.fecha_inicio)],
      ['Fecha fin', this.formatDate(obra.fecha_fin)]
    ]);

    const subtotal = costos.reduce((acc, costo) => acc + (costo.subtotal ?? costo.total ?? 0), 0);
    const beneficioFactor = obra.beneficio_global ? 1 + (obra.beneficio ?? 0) / 100 : 1;
    const comisionFactor = obra.tiene_comision ? 1 + (obra.comision ?? 0) / 100 : 1;
    const total = subtotal * beneficioFactor * comisionFactor;

    this.drawTable(
      doc,
      y,
      'Detalle de partidas',
      ['Ítem', 'Descripción', 'Cantidad', 'Precio unitario', 'Total'],
      costos.map((costo, index) => [
        (index + 1).toString(),
        costo.descripcion,
        `${costo.cantidad} ${costo.unidad}`,
        this.formatCurrency(costo.precio_unitario),
        this.formatCurrency(costo.total)
      ]),
      {
        footer: [
          ['Subtotal', this.formatCurrency(subtotal)],
          ['Presupuesto total', this.formatCurrency(total)]
        ]
      }
    );

    doc.save(`presupuesto-${obra.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

  async exportObrasFiltradasExcel(obras: Obra[]): Promise<void> {
    const logo = await this.getLogoDataUrl();
    const rows = obras.length
      ? obras.map((obra) => `
          <tr>
            <td>${this.escapeHtml(obra.nombre)}</td>
            <td>${this.escapeHtml(obra.cliente?.nombre || '—')}</td>
            <td>${this.escapeHtml(obra.obra_estado || '—')}</td>
            <td>${this.formatDate(obra.fecha_inicio)}</td>
            <td>${this.formatDate(obra.fecha_fin)}</td>
            <td>${this.formatCurrency(obra.presupuesto)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="6" class="text-center">Sin resultados</td></tr>';

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            .brand { background: #f0a500; color: #fff; padding: 16px; display: flex; align-items: center; gap: 16px; }
            .brand img { height: 60px; }
            h1 { margin: 0; font-size: 22px; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; }
            th { background: #fdf2d0; color: #5c3b07; padding: 8px; border: 1px solid #f0a500; }
            td { border: 1px solid #f0a500; padding: 8px; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="brand">
            ${logo ? `<img src="${logo}" alt="Meliquina" />` : ''}
            <h1>Listado de obras filtradas</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>Obra</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Presupuesto</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    this.triggerDownload(html, this.excelMime, `obras-filtradas-${this.timestamp()}.xls`);
  }

  async exportObraOperacionExcel(obra: Obra, tareas: Tarea[], costos: ObraCosto[], movimientos: Transaccion[]): Promise<void> {
    const logo = await this.getLogoDataUrl();
    const subtotal = costos.reduce((acc, costo) => acc + (costo.subtotal ?? costo.total ?? 0), 0);
    const beneficioFactor = obra.beneficio_global ? 1 + (obra.beneficio ?? 0) / 100 : 1;
    const comisionFactor = obra.tiene_comision ? 1 + (obra.comision ?? 0) / 100 : 1;
    const total = subtotal * beneficioFactor * comisionFactor;

    const tareasRows = tareas.length ? tareas.map((t) => `
        <tr>
          <td>${this.escapeHtml(t.nombre)}</td>
          <td>${this.escapeHtml(t.estado_tarea)}</td>
          <td>${this.formatDate(t.fecha_inicio)}</td>
          <td>${this.formatDate(t.fecha_fin)}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" class="text-center">Sin tareas registradas</td></tr>';

    const movimientosRows = movimientos.length ? movimientos.map((mov) => `
        <tr>
          <td>${this.formatDate(mov.fecha as any)}</td>
          <td>${this.escapeHtml(mov.tipo_transaccion)}</td>
          <td>${this.formatCurrency(mov.monto)}</td>
          <td>${this.escapeHtml(mov.forma_pago || '—')}</td>
          <td>${mov.tipo_asociado || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center">Sin movimientos</td></tr>';

    const costosRows = costos.length ? costos.map((costo, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${this.escapeHtml(costo.descripcion)}</td>
          <td>${this.escapeHtml(costo.proveedor?.nombre || '—')}</td>
          <td>${this.escapeHtml(costo.estado_pago || '—')}</td>
          <td>${this.formatCurrency(costo.total)}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center">Sin costos</td></tr>';

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            .brand { background: #f0a500; color: #fff; padding: 16px; display: flex; align-items: center; gap: 16px; }
            .brand img { height: 60px; }
            h1 { margin: 0; font-size: 22px; }
            section { margin-top: 16px; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; }
            th { background: #fdf2d0; color: #5c3b07; padding: 8px; border: 1px solid #f0a500; }
            td { border: 1px solid #f0a500; padding: 8px; }
            .text-center { text-align: center; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
            .summary div { background: #fff8e6; padding: 12px; border: 1px solid #f0a500; border-radius: 6px; }
            .summary strong { display: block; font-size: 12px; color: #5c3b07; }
          </style>
        </head>
        <body>
          <div class="brand">
            ${logo ? `<img src="${logo}" alt="Meliquina" />` : ''}
            <div>
              <h1>Hoja operativa - ${this.escapeHtml(obra.nombre)}</h1>
              <p>${this.escapeHtml(obra.cliente?.nombre || '')}</p>
            </div>
          </div>
          <section>
            <h2>Resumen</h2>
            <div class="summary">
              <div><strong>Presupuesto</strong><span>${this.formatCurrency(obra.presupuesto)}</span></div>
              <div><strong>Subtotal costos</strong><span>${this.formatCurrency(subtotal)}</span></div>
              <div><strong>Total proyectado</strong><span>${this.formatCurrency(total)}</span></div>
              <div><strong>Fechas</strong><span>${this.formatDate(obra.fecha_inicio)} - ${this.formatDate(obra.fecha_fin)}</span></div>
            </div>
          </section>
          <section>
            <h2>Tareas</h2>
            <table>
              <thead>
                <tr><th>Nombre</th><th>Estado</th><th>Inicio</th><th>Fin</th></tr>
              </thead>
              <tbody>${tareasRows}</tbody>
            </table>
          </section>
          <section>
            <h2>Movimientos</h2>
            <table>
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Forma de pago</th><th>Asociado</th></tr>
              </thead>
              <tbody>${movimientosRows}</tbody>
            </table>
          </section>
          <section>
            <h2>Costos</h2>
            <table>
              <thead>
                <tr><th>#</th><th>Descripción</th><th>Proveedor</th><th>Estado</th><th>Total</th></tr>
              </thead>
              <tbody>${costosRows}</tbody>
            </table>
          </section>
        </body>
      </html>`;

    this.triggerDownload(html, this.excelMime, `obra-${obra.id}-operacion-${this.timestamp()}.xls`);
  }

  async exportReportesPdf(payload: ReportPayload, filtrosDescripcion: string[]): Promise<void> {
    const {doc, startY} = await this.createBrandedPdf('Reporte consolidado');
    let y = startY;

    if (filtrosDescripcion.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros aplicados', 40, y);
      doc.setFont('helvetica', 'normal');
      y += 16;
      filtrosDescripcion.forEach((texto) => {
        doc.text(`• ${texto}`, 50, y);
        y += 14;
      });
      y += 10;
    }

    if (payload.resumen) {
      y = this.drawInfoBlock(doc, y, 'Indicadores generales', [
        ['Obras', payload.resumen.totalObras.toString()],
        ['Clientes', payload.resumen.totalClientes.toString()],
        ['Proveedores', payload.resumen.totalProveedores.toString()],
        ['Ingresos', this.formatCurrency(payload.resumen.totalIngresos)],
        ['Egresos', this.formatCurrency(payload.resumen.totalEgresos)]
      ]);
    }

    if (payload.ingresosEgresos) {
      y = this.drawTable(
        doc,
        y,
        'Ingresos vs Egresos por obra',
        ['Obra', 'Cliente', 'Ingresos', 'Egresos'],
        payload.ingresosEgresos.detallePorObra.map((item) => [
          item.obraNombre,
          item.clienteNombre,
          this.formatCurrency(item.ingresos),
          this.formatCurrency(item.egresos)
        ])
      );
    }

    if (payload.pendientes) {
      y = this.drawTable(
        doc,
        y,
        'Pendientes',
        ['Obra', 'Proveedor', 'Estado', 'Total', 'Descripción'],
        payload.pendientes.pendientes.map((pendiente) => [
          pendiente.obraNombre,
          pendiente.proveedorNombre,
          pendiente.estadoPago,
          this.formatCurrency(pendiente.total),
          pendiente.descripcion
        ])
      );
    }

    if (payload.flujoCaja?.movimientos?.length) {
      this.drawTable(
        doc,
        y,
        'Movimientos del flujo de caja',
        ['Fecha', 'Tipo', 'Monto', 'Obra', 'Forma de pago'],
        payload.flujoCaja.movimientos.map((mov) => [
          this.formatDate(mov.fecha),
          mov.tipo,
          this.formatCurrency(mov.monto),
          mov.obraNombre,
          mov.formaPago
        ])
      );
    }

    doc.save(`reporte-${this.timestamp()}.pdf`);
  }

  async exportReportesExcel(payload: ReportPayload): Promise<void> {
    const logo = await this.getLogoDataUrl();
    const resumen = payload.resumen;
    const detalle = payload.ingresosEgresos?.detallePorObra ?? [];
    const pendientes = payload.pendientes?.pendientes ?? [];
    const movimientos = payload.flujoCaja?.movimientos ?? [];

    const detalleRows = detalle.length ? detalle.map((item) => `
        <tr>
          <td>${this.escapeHtml(item.obraNombre)}</td>
          <td>${this.escapeHtml(item.clienteNombre)}</td>
          <td>${this.formatCurrency(item.ingresos)}</td>
          <td>${this.formatCurrency(item.egresos)}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" class="text-center">Sin información</td></tr>';

    const pendientesRows = pendientes.length ? pendientes.map((item) => `
        <tr>
          <td>${this.escapeHtml(item.obraNombre)}</td>
          <td>${this.escapeHtml(item.proveedorNombre)}</td>
          <td>${this.escapeHtml(item.estadoPago)}</td>
          <td>${this.formatCurrency(item.total)}</td>
          <td>${this.escapeHtml(item.descripcion)}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center">Sin pendientes</td></tr>';

    const movimientosRows = movimientos.length ? movimientos.map((mov) => `
        <tr>
          <td>${this.formatDate(mov.fecha)}</td>
          <td>${this.escapeHtml(mov.tipo)}</td>
          <td>${this.formatCurrency(mov.monto)}</td>
          <td>${this.escapeHtml(mov.obraNombre)}</td>
          <td>${this.escapeHtml(mov.formaPago)}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center">Sin movimientos</td></tr>';

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            .brand { background: #f0a500; color: #fff; padding: 16px; display: flex; align-items: center; gap: 16px; }
            .brand img { height: 60px; }
            h1 { margin: 0; font-size: 22px; }
            section { margin-top: 18px; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; }
            th { background: #fdf2d0; color: #5c3b07; padding: 8px; border: 1px solid #f0a500; }
            td { border: 1px solid #f0a500; padding: 8px; }
            .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
            .summary div { background: #fff8e6; padding: 12px; border: 1px solid #f0a500; border-radius: 6px; }
            .summary strong { display: block; font-size: 12px; color: #5c3b07; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="brand">
            ${logo ? `<img src="${logo}" alt="Meliquina" />` : ''}
            <h1>Reporte consolidado</h1>
          </div>
          <section>
            <h2>Indicadores generales</h2>
            <div class="summary">
              <div><strong>Obras</strong><span>${resumen?.totalObras ?? 0}</span></div>
              <div><strong>Clientes</strong><span>${resumen?.totalClientes ?? 0}</span></div>
              <div><strong>Proveedores</strong><span>${resumen?.totalProveedores ?? 0}</span></div>
              <div><strong>Ingresos</strong><span>${this.formatCurrency(resumen?.totalIngresos)}</span></div>
              <div><strong>Egresos</strong><span>${this.formatCurrency(resumen?.totalEgresos)}</span></div>
              <div><strong>Saldo</strong><span>${this.formatCurrency((resumen?.totalIngresos ?? 0) - (resumen?.totalEgresos ?? 0))}</span></div>
            </div>
          </section>
          <section>
            <h2>Ingresos vs egresos</h2>
            <table>
              <thead><tr><th>Obra</th><th>Cliente</th><th>Ingresos</th><th>Egresos</th></tr></thead>
              <tbody>${detalleRows}</tbody>
            </table>
          </section>
          <section>
            <h2>Pendientes</h2>
            <table>
              <thead><tr><th>Obra</th><th>Proveedor</th><th>Estado</th><th>Total</th><th>Descripción</th></tr></thead>
              <tbody>${pendientesRows}</tbody>
            </table>
          </section>
          <section>
            <h2>Movimientos incluidos</h2>
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Obra</th><th>Forma de pago</th></tr></thead>
              <tbody>${movimientosRows}</tbody>
            </table>
          </section>
        </body>
      </html>`;

    this.triggerDownload(html, this.excelMime, `reporte-${this.timestamp()}.xls`);
  }

  private async createBrandedPdf(title: string): Promise<{ doc: jsPDF; startY: number }> {
    const doc = new jsPDF('p', 'pt', 'a4');
    const width = doc.internal.pageSize.getWidth();
    doc.setFillColor(240, 165, 0);
    doc.rect(0, 0, width, 80, 'F');

    const logo = await this.getLogoDataUrl();
    if (logo) {
      doc.addImage(logo, 'JPEG', 40, 15, 120, 50);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Meliquina Construcciones', 180, 45);

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(16);
    doc.text(title, 40, 110);

    return {doc, startY: 130};
  }

  private drawInfoBlock(doc: jsPDF, startY: number, title: string, rows: [string, string][]): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, 40, startY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let y = startY + 16;

    rows.forEach(([label, value]) => {
      doc.text(`${label}:`, 40, y);
      doc.text(value || '—', 160, y);
      y += 14;
    });

    return y + 6;
  }

  private drawTable(
    doc: jsPDF,
    startY: number,
    title: string,
    head: string[],
    body: string[][],
    options?: { footer?: [string, string][] }
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, 40, startY);

    if (!body.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Sin datos', 40, startY + 18);
      return startY + 32;
    }

    const footRows = options?.footer
      ? options.footer.map(([label, value]) => {
        const row = new Array(head.length).fill('');
        row[Math.max(head.length - 2, 0)] = label;
        row[Math.max(head.length - 1, 0)] = value;
        return row;
      })
      : undefined;

    autoTable(doc, {
      startY: startY + 10,
      head: [head],
      body,
      styles: { fontSize: 10, halign: 'left' },
      headStyles: { fillColor: [240, 165, 0], textColor: 255 },
      foot: footRows,
      footStyles: { fillColor: [33, 33, 33], textColor: 255, halign: 'right' }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((doc as any).lastAutoTable?.finalY || startY) + 20;
  }

  private async getLogoDataUrl(): Promise<string> {
    if (!this.logoPromise) {
      this.logoPromise = lastValueFrom(
        this.http.get('assets/img/meliquina-logo.jpg', {responseType: 'blob'})
      )
        .then((blob) => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        }))
        .catch(() => '');
    }
    return this.logoPromise;
  }

  private triggerDownload(content: string, mime: string, filename: string) {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private formatCurrency(value?: number | null): string {
    return new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'}).format(value ?? 0);
  }

  private formatDate(value?: string | null): string {
    if (!value) return '—';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value.toString();
      }
      return new Intl.DateTimeFormat('es-AR').format(date);
    } catch {
      return value.toString();
    }
  }

  private timestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }

  private capitalize(value: string): string {
    if (!value) return '—';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private escapeHtml(value: string): string {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
