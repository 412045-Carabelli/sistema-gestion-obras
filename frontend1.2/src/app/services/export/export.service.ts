import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, {Styles} from 'jspdf-autotable';
import {
  Cliente,
  FlujoCajaResponse,
  IngresosEgresosResponse,
  Obra,
  ObraCosto,
  PendientesResponse,
  Proveedor,
  RankingClientesResponse,
  RankingProveedoresResponse,
  ResumenGeneralResponse,
  EstadoObrasResponse,
  AvanceTareasResponse,
  NotasObraResponse,
  CostosPorCategoriaResponse,
  ReportFilter,
  Tarea,
  Transaccion,
  EstadoFinancieroObraResponse
} from '../../core/models/models';

interface EntidadPdfOptions {
  tipo: 'cliente' | 'proveedor';
  entidad: Cliente | Proveedor;
  obras: Obra[];
  tareasPorObra?: Record<number, Tarea[]>;
  movimientosPendientes?: Transaccion[];
  costosPendientes?: ObraCosto[];
}

interface PresupuestoPdfOptions {
  obra: Obra;
  costos: ObraCosto[];
  subtotal: number;
  total: number;
}

interface ExcelSheetDefinition {
  name: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export interface ReportesSnapshot {
  filtros: Record<string, string | number | null>;
  resumenGeneral: ResumenGeneralResponse | null;
  ingresosEgresos: IngresosEgresosResponse | null;
  flujoCaja: FlujoCajaResponse | null;
  pendientes: PendientesResponse | null;
  estadoObras: EstadoObrasResponse | null;
  avanceTareas: AvanceTareasResponse | null;
  rankingClientes: RankingClientesResponse | null;
  rankingProveedores: RankingProveedoresResponse | null;
  notasGenerales?: NotasObraResponse[];
  costosPorCategoria?: CostosPorCategoriaResponse | null;
  estadoFinancieroObra?: EstadoFinancieroObraResponse | null;
}

@Injectable({providedIn: 'root'})
export class ExportService {
  private readonly brandColor = {hex: '#f5a300', r: 245, g: 163, b: 0};
  private readonly currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('es-AR');

  exportEntidadDetallePdf(options: EntidadPdfOptions) {
    const doc = new jsPDF();
    let cursorY = this.drawHeader(doc,
      options.tipo === 'cliente' ? 'Ficha de Cliente' : 'Ficha de Proveedor',
      (options.entidad as any).nombre);

    cursorY = this.drawSectionTitle(doc, 'Datos generales', cursorY);
    autoTable(doc, {
      startY: cursorY,
      head: [['Campo', 'Valor']],
      body: this.buildEntidadBody(options),
      theme: 'striped',
      styles: {fontSize: 10},
      headStyles: this.tableHeadStyle()
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;

    cursorY = this.drawSectionTitle(doc, 'Obras asociadas', cursorY);
    if (options.obras.length) {
      autoTable(doc, {
        startY: cursorY,
        head: [['Obra', 'Estado', 'Inicio', 'Fin', 'Presupuesto']],
        body: options.obras.map(obra => ([
          `#${obra.id} - ${obra.nombre}`,
          obra.obra_estado?.nombre || '—',
          this.formatDate(obra.fecha_inicio),
          this.formatDate(obra.fecha_fin),
          this.formatCurrency(obra.presupuesto)
        ])),
        theme: 'grid',
        styles: {fontSize: 9},
        headStyles: this.tableHeadStyle()
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay obras asociadas.');
    }

    if (options.tareasPorObra) {
      cursorY = this.drawSectionTitle(doc, 'Tareas asignadas', cursorY);
      const filas: string[][] = [];
      Object.entries(options.tareasPorObra).forEach(([idObra, tareas]) => {
        tareas.forEach(t => filas.push([
          `Obra #${idObra}`,
          t.nombre,
          t.proveedor?.nombre || '—',
          t.estado_tarea?.nombre || '—',
          `${this.formatDate(t.fecha_inicio)} / ${this.formatDate(t.fecha_fin)}`
        ]));
      });
      if (filas.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', 'Tarea', 'Proveedor', 'Estado', 'Fechas']],
          body: filas,
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay tareas pendientes.');
      }
    }

    if (options.movimientosPendientes) {
      cursorY = this.drawSectionTitle(doc, 'Movimientos pendientes', cursorY);
      if (options.movimientosPendientes.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Fecha', 'Tipo', 'Obra', 'Monto', 'Estado']],
          body: options.movimientosPendientes.map(m => ([
            this.formatDate(m.fecha),
            m.tipo_transaccion?.nombre || '—',
            m.id_obra ? `Obra #${m.id_obra}` : '—',
            this.formatCurrency(m.monto),
            (m.forma_pago || (m as any).parcial_o_total || 'Pendiente').toString()
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay movimientos pendientes.');
      }
    }

    if (options.costosPendientes) {
      cursorY = this.drawSectionTitle(doc, 'Pagos pendientes', cursorY);
      if (options.costosPendientes.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', 'Proveedor', 'Descripción', 'Total']],
          body: options.costosPendientes.map(c => ([
            `Obra #${c.id_obra}`,
            c.proveedor?.nombre || '—',
            c.descripcion,
            this.formatCurrency(c.total)
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay pagos pendientes.');
      }
    }

    this.addFooter(doc);
    doc.save(`${this.slug((options.entidad as any).nombre)}-${options.tipo}-detalle.pdf`);
  }

  exportPresupuestoPdf(options: PresupuestoPdfOptions) {
    const doc = new jsPDF('p', 'mm', 'a4');
    let cursorY = this.drawHeader(doc, 'Cotización de Obra', options.obra.nombre);

    cursorY = this.drawSectionTitle(doc, 'Datos de la obra', cursorY);
    autoTable(doc, {
      startY: cursorY,
      head: [['Campo', 'Valor']],
      body: [
        ['Cliente', options.obra.cliente?.nombre || '—'],
        ['CUIT', options.obra.cliente?.cuit || '—'],
        ['Email', options.obra.cliente?.email || '—'],
        ['Inicio', this.formatDate(options.obra.fecha_inicio)],
        ['Fin estimada', this.formatDate(options.obra.fecha_fin)],
        ['Presupuesto total', this.formatCurrency(options.total)]
      ],
      theme: 'striped',
      styles: {fontSize: 10},
      headStyles: this.tableHeadStyle()
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: cursorY,
      head: [['Ítem', 'Proveedor', 'Cantidad', 'Precio unitario', 'Subtotal']],
      body: options.costos.map((c, index) => ([
        `${index + 1}. ${c.descripcion}`,
        c.proveedor?.nombre || '—',
        `${c.cantidad} ${c.unidad}`,
        this.formatCurrency(c.precio_unitario),
        this.formatCurrency(c.total)
      ])),
      theme: 'grid',
      styles: {fontSize: 9},
      headStyles: this.tableHeadStyle()
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen económico', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ${this.formatCurrency(options.subtotal)}`, 14, finalY + 8);
    doc.text(`Total presupuesto (con honorarios y comisiones): ${this.formatCurrency(options.total)}`, 14, finalY + 16);

    this.addFooter(doc);
    doc.save(`cotizacion-obra-${options.obra.id}.pdf`);
  }

  exportObrasExcel(obras: Obra[]) {
    const resumenPorEstado = obras.reduce((acc, obra) => {
      const estado = obra.obra_estado?.nombre || 'Sin estado';
      if (!acc[estado]) {
        acc[estado] = {cantidad: 0, presupuesto: 0};
      }
      acc[estado].cantidad += 1;
      acc[estado].presupuesto += obra.presupuesto ?? 0;
      return acc;
    }, {} as Record<string, {cantidad: number; presupuesto: number}>);

    const totalPresupuesto = obras.reduce((sum, obra) => sum + (obra.presupuesto ?? 0), 0);
    const resumenRows = Object.entries(resumenPorEstado).map(([estado, info]) => ([
      estado,
      info.cantidad,
      info.presupuesto
    ]));
    resumenRows.push(['Total', obras.length, totalPresupuesto]);

    const sheets: ExcelSheetDefinition[] = [
      {
        name: 'Resumen',
        headers: ['Estado', 'Cantidad', 'Presupuesto acumulado'],
        rows: resumenRows
      },
      {
        name: 'Obras',
        headers: ['Obra', 'Cliente', 'Estado', 'Inicio', 'Fin', 'Presupuesto'],
        rows: obras.map(obra => ([
          `#${obra.id} - ${obra.nombre}`,
          obra.cliente?.nombre || '—',
          obra.obra_estado?.nombre || '—',
          this.formatDate(obra.fecha_inicio),
          this.formatDate(obra.fecha_fin),
          obra.presupuesto ?? 0
        ]))
      }
    ];

    const xml = this.buildExcelXml(sheets);
    this.downloadExcel(xml, `obras-filtradas-${this.timestamp()}.xls`);
  }

  exportObraDetalleExcel(options: {
    obra: Obra;
    tareas: Tarea[];
    transacciones: Transaccion[];
    costos: ObraCosto[];
  }) {
    const pendienteCobro = options.transacciones
      .filter(t => this.isPendienteMovimiento(t) && (t.tipo_transaccion?.id === 1))
      .reduce((sum, t) => sum + (t.monto || 0), 0);
    const pendientePago = options.costos
      .filter(c => (c.estado_pago ?? c.id_estado_pago) === 1)
      .reduce((sum, c) => sum + (c.total || 0), 0);

    const sheets: ExcelSheetDefinition[] = [
      {
        name: 'Resumen',
        headers: ['Campo', 'Detalle'],
        rows: [
          ['Obra', options.obra.nombre],
          ['Cliente', options.obra.cliente?.nombre || '—'],
          ['Estado', options.obra.obra_estado?.nombre || '—'],
          ['Inicio', this.formatDate(options.obra.fecha_inicio)],
          ['Fin', this.formatDate(options.obra.fecha_fin)],
          ['Presupuesto', options.obra.presupuesto ?? 0],
          ['Subtotal costos', options.costos.reduce((sum, c) => sum + (c.total || 0), 0)],
          ['Pendiente de cobro', pendienteCobro],
          ['Pendiente de pago', pendientePago]
        ]
      },
      {
        name: 'Tareas',
        headers: ['Tarea', 'Proveedor', 'Estado', 'Inicio', 'Fin'],
        rows: options.tareas.map(t => ([
          t.nombre,
          t.proveedor?.nombre || '—',
          t.estado_tarea?.nombre || '—',
          this.formatDate(t.fecha_inicio),
          this.formatDate(t.fecha_fin)
        ]))
      },
      {
        name: 'Movimientos',
        headers: ['Fecha', 'Tipo', 'Asociado', 'Forma', 'Monto', 'Pendiente'],
        rows: options.transacciones.map(t => ([
          this.formatDate(t.fecha),
          t.tipo_transaccion?.nombre || '—',
          t.tipo_asociado ? `${t.tipo_asociado} #${t.id_asociado}` : '—',
          (t.forma_pago || (t as any).parcial_o_total || '—').toString(),
          t.monto,
          this.isPendienteMovimiento(t) ? 'Si' : 'No'
        ]))
      },
      {
        name: 'Costos',
        headers: ['Proveedor', 'Descripción', 'Cantidad', 'Precio unitario', 'Estado', 'Total'],
        rows: options.costos.map(c => ([
          c.proveedor?.nombre || '—',
          c.descripcion,
          `${c.cantidad} ${c.unidad}`,
          c.precio_unitario,
          (c.estado_pago ?? c.id_estado_pago) === 1 ? 'Pendiente' : 'Pagado',
          c.total
        ]))
      }
    ];

    const xml = this.buildExcelXml(sheets);
    this.downloadExcel(xml, `obra-${options.obra.id}-detalle.xls`);
  }

  exportReportesPdf(snapshot: ReportesSnapshot) {
    const doc = new jsPDF('p', 'mm', 'a4');
    let cursorY = this.drawHeader(doc, 'Reporte consolidado', 'Panel de control');

    cursorY = this.drawSectionTitle(doc, 'Filtros aplicados', cursorY);
    const filtros = Object.entries(snapshot.filtros || {});
    if (filtros.length) {
      autoTable(doc, {
        startY: cursorY,
        head: [['Filtro', 'Valor']],
        body: filtros.map(([k, v]) => [k, v ?? '—']),
        theme: 'striped',
        headStyles: this.tableHeadStyle(),
        styles: {fontSize: 9}
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      cursorY = this.drawEmptyMessage(doc, cursorY, 'Sin filtros (datos generales).');
    }

    if (snapshot.resumenGeneral) {
      cursorY = this.drawSectionTitle(doc, 'Indicadores generales', cursorY);
      autoTable(doc, {
        startY: cursorY,
        head: [['Obras', 'Clientes', 'Proveedores', 'Ingresos', 'Egresos']],
        body: [[
          snapshot.resumenGeneral.totalObras,
          snapshot.resumenGeneral.totalClientes,
          snapshot.resumenGeneral.totalProveedores,
          this.formatCurrency(snapshot.resumenGeneral.totalIngresos),
          this.formatCurrency(snapshot.resumenGeneral.totalEgresos)
        ]],
        theme: 'grid',
        headStyles: this.tableHeadStyle(),
        styles: {fontSize: 10}
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (snapshot.ingresosEgresos) {
      cursorY = this.drawSectionTitle(doc, 'Ingresos/Egresos por obra', cursorY);
      if (snapshot.ingresosEgresos.detallePorObra.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', 'Cliente', 'Ingresos', 'Egresos']],
          body: snapshot.ingresosEgresos.detallePorObra.map(d => ([
            d.obraNombre,
            d.clienteNombre,
            this.formatCurrency(d.ingresos),
            this.formatCurrency(d.egresos)
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    if (snapshot.flujoCaja) {
      cursorY = this.drawSectionTitle(doc, 'Movimientos del flujo de caja', cursorY);
      if (snapshot.flujoCaja.movimientos.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Fecha', 'Tipo', 'Obra', 'Monto', 'Forma']],
          body: snapshot.flujoCaja.movimientos.map(m => ([
            this.formatDate(m.fecha),
            m.tipo,
            m.obraNombre,
            this.formatCurrency(m.monto),
            m.formaPago
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    if (snapshot.pendientes?.pendientes?.length) {
      cursorY = this.drawSectionTitle(doc, 'Pendientes', cursorY);
      autoTable(doc, {
        startY: cursorY,
        head: [['Obra', 'Proveedor', 'Estado', 'Descripción', 'Total']],
        body: snapshot.pendientes.pendientes.map(p => ([
          p.obraNombre,
          p.proveedorNombre,
          p.estadoPago,
          p.descripcion,
          this.formatCurrency(p.total)
        ])),
        theme: 'grid',
        styles: {fontSize: 9},
        headStyles: this.tableHeadStyle()
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (snapshot.costosPorCategoria?.categorias?.length) {
      cursorY = this.drawSectionTitle(doc, 'Costos por categoría', cursorY);
      autoTable(doc, {
        startY: cursorY,
        head: [['Categoría', 'Participación', 'Total']],
        body: snapshot.costosPorCategoria.categorias.map(cat => ([
          cat.categoria,
          `${cat.porcentaje}%`,
          this.formatCurrency(cat.total)
        ])),
        theme: 'grid',
        styles: {fontSize: 9},
        headStyles: this.tableHeadStyle()
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (snapshot.estadoObras) {
      cursorY = this.drawSectionTitle(doc, 'Estado de las obras', cursorY);
      if (snapshot.estadoObras.obras.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', 'Estado', 'Cliente', 'Inicio', 'Fin']],
          body: snapshot.estadoObras.obras.map(o => ([
            o.obraNombre,
            o.estado,
            o.clienteNombre,
            this.formatDate(o.fechaInicio),
            this.formatDate(o.fechaFin)
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay obras dentro del filtro.');
      }
    }

    if (snapshot.avanceTareas) {
      cursorY = this.drawSectionTitle(doc, 'Avance de tareas', cursorY);
      if (snapshot.avanceTareas.avances.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', '% avance', 'Tareas completas', 'Total tareas']],
          body: snapshot.avanceTareas.avances.map(a => ([
            a.obraNombre,
            `${a.porcentaje}%`,
            a.tareasCompletadas,
            a.totalTareas
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay tareas registradas.');
      }
    }

    if (snapshot.rankingClientes) {
      cursorY = this.drawSectionTitle(doc, 'Ranking de clientes', cursorY);
      if (snapshot.rankingClientes.clientes.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Cliente', 'Obras', 'Ingresos', 'Egresos']],
          body: snapshot.rankingClientes.clientes.map(c => ([
            c.clienteNombre,
            c.cantidadObras,
            this.formatCurrency(c.totalIngresos),
            this.formatCurrency(c.totalEgresos)
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No se registran clientes en el período.');
      }
    }

    if (snapshot.rankingProveedores) {
      cursorY = this.drawSectionTitle(doc, 'Ranking de proveedores', cursorY);
      if (snapshot.rankingProveedores.proveedores.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Proveedor', 'Obras atendidas', 'Total costos']],
          body: snapshot.rankingProveedores.proveedores.map(p => ([
            p.proveedorNombre,
            p.cantidadObras,
            this.formatCurrency(p.totalCostos)
          ])),
          theme: 'grid',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay proveedores destacados para el filtro.');
      }
    }

    if (snapshot.notasGenerales) {
      cursorY = this.drawSectionTitle(doc, 'Notas de obras', cursorY);
      if (snapshot.notasGenerales.length) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Obra', 'Estado', 'Cliente', 'Notas']],
          body: snapshot.notasGenerales.map(n => ([
            n.obraNombre,
            n.estado,
            n.clienteNombre,
            n.notas || '—'
          ])),
          theme: 'striped',
          styles: {fontSize: 9},
          headStyles: this.tableHeadStyle()
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        cursorY = this.drawEmptyMessage(doc, cursorY, 'No hay notas registradas.');
      }
    }

    if (snapshot.estadoFinancieroObra) {
      cursorY = this.drawSectionTitle(doc,
        `Estado financiero - ${snapshot.estadoFinancieroObra.obraNombre}`,
        cursorY);
      autoTable(doc, {
        startY: cursorY,
        head: [['Campo', 'Valor']],
        body: [
          ['Cliente', snapshot.estadoFinancieroObra.clienteNombre],
          ['Estado', snapshot.estadoFinancieroObra.estadoObra],
          ['Presupuesto', this.formatCurrency(snapshot.estadoFinancieroObra.presupuesto)],
          ['Costos', this.formatCurrency(snapshot.estadoFinancieroObra.costos)],
          ['Cobros', this.formatCurrency(snapshot.estadoFinancieroObra.cobros)],
          ['Pagos', this.formatCurrency(snapshot.estadoFinancieroObra.pagos)],
          ['Utilidad neta', this.formatCurrency(snapshot.estadoFinancieroObra.utilidadNeta)],
          ['Notas', snapshot.estadoFinancieroObra.notas || '—']
        ],
        theme: 'striped',
        styles: {fontSize: 9},
        headStyles: this.tableHeadStyle()
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    this.addFooter(doc);
    doc.save(`reporte-consolidado-${this.timestamp()}.pdf`);
  }

  exportReportesExcel(snapshot: ReportesSnapshot) {
    const sheets: ExcelSheetDefinition[] = [];
    sheets.push({
      name: 'Filtros',
      headers: ['Filtro', 'Valor'],
      rows: Object.entries(snapshot.filtros || {}).map(([k, v]) => [k, v ?? '—'])
    });

    if (snapshot.resumenGeneral) {
      sheets.push({
        name: 'Resumen',
        headers: ['Obras', 'Clientes', 'Proveedores', 'Ingresos', 'Egresos'],
        rows: [[
          snapshot.resumenGeneral.totalObras,
          snapshot.resumenGeneral.totalClientes,
          snapshot.resumenGeneral.totalProveedores,
          snapshot.resumenGeneral.totalIngresos,
          snapshot.resumenGeneral.totalEgresos
        ]]
      });
    }

    if (snapshot.ingresosEgresos) {
      const rows = snapshot.ingresosEgresos.detallePorObra.map(d => ([
        d.obraNombre,
        d.clienteNombre,
        d.ingresos,
        d.egresos
      ]));
      rows.push([
        'Totales',
        '—',
        snapshot.ingresosEgresos.totalIngresos,
        snapshot.ingresosEgresos.totalEgresos
      ]);
      sheets.push({
        name: 'Ingresos vs egresos',
        headers: ['Obra', 'Cliente', 'Ingresos', 'Egresos'],
        rows
      });
    }

    if (snapshot.flujoCaja) {
      sheets.push({
        name: 'Movimientos',
        headers: ['Fecha', 'Tipo', 'Obra', 'Monto', 'Forma', 'Asociado'],
        rows: snapshot.flujoCaja.movimientos.map(m => ([
          this.formatDate(m.fecha),
          m.tipo,
          m.obraNombre,
          m.monto,
          m.formaPago,
          `${m.asociadoTipo} #${m.asociadoId}`
        ]))
      });
    }

    if (snapshot.pendientes) {
      sheets.push({
        name: 'Pendientes',
        headers: ['Obra', 'Proveedor', 'Estado', 'Descripción', 'Total'],
        rows: snapshot.pendientes.pendientes.map(p => ([
          p.obraNombre,
          p.proveedorNombre,
          p.estadoPago,
          p.descripcion,
          p.total
        ]))
      });
    }

    if (snapshot.estadoObras) {
      sheets.push({
        name: 'Estado de obras',
        headers: ['Obra', 'Estado', 'Cliente', 'Inicio', 'Fin'],
        rows: snapshot.estadoObras.obras.map(o => ([
          o.obraNombre,
          o.estado,
          o.clienteNombre,
          this.formatDate(o.fechaInicio),
          this.formatDate(o.fechaFin)
        ]))
      });
    }

    if (snapshot.avanceTareas) {
      sheets.push({
        name: 'Avance tareas',
        headers: ['Obra', 'Porcentaje', 'Total tareas', 'Completadas'],
        rows: snapshot.avanceTareas.avances.map(a => ([
          a.obraNombre,
          `${a.porcentaje}%`,
          a.totalTareas,
          a.tareasCompletadas
        ]))
      });
    }

    if (snapshot.costosPorCategoria) {
      sheets.push({
        name: 'Costos por categoría',
        headers: ['Categoría', 'Participación', 'Total'],
        rows: snapshot.costosPorCategoria.categorias.map(cat => ([
          cat.categoria,
          `${cat.porcentaje}%`,
          cat.total
        ])).concat([[
          'Total',
          '100%',
          snapshot.costosPorCategoria.total
        ]])
      });
    }

    if (snapshot.rankingClientes) {
      sheets.push({
        name: 'Ranking clientes',
        headers: ['Cliente', 'Obras', 'Ingresos', 'Egresos'],
        rows: snapshot.rankingClientes.clientes.map(c => ([
          c.clienteNombre,
          c.cantidadObras,
          c.totalIngresos,
          c.totalEgresos
        ]))
      });
    }

    if (snapshot.rankingProveedores) {
      sheets.push({
        name: 'Ranking proveedores',
        headers: ['Proveedor', 'Obras atendidas', 'Total costos'],
        rows: snapshot.rankingProveedores.proveedores.map(p => ([
          p.proveedorNombre,
          p.cantidadObras,
          p.totalCostos
        ]))
      });
    }

    if (snapshot.notasGenerales) {
      sheets.push({
        name: 'Notas',
        headers: ['Obra', 'Estado', 'Cliente', 'Notas'],
        rows: snapshot.notasGenerales.map(n => ([
          n.obraNombre,
          n.estado,
          n.clienteNombre,
          n.notas || '—'
        ]))
      });
    }

    if (snapshot.estadoFinancieroObra) {
      sheets.push({
        name: 'Estado financiero',
        headers: ['Campo', 'Valor'],
        rows: [
          ['Obra', snapshot.estadoFinancieroObra.obraNombre],
          ['Cliente', snapshot.estadoFinancieroObra.clienteNombre],
          ['Estado', snapshot.estadoFinancieroObra.estadoObra],
          ['Presupuesto', snapshot.estadoFinancieroObra.presupuesto],
          ['Costos', snapshot.estadoFinancieroObra.costos],
          ['Cobros', snapshot.estadoFinancieroObra.cobros],
          ['Pagos', snapshot.estadoFinancieroObra.pagos],
          ['Utilidad neta', snapshot.estadoFinancieroObra.utilidadNeta],
          ['Notas', snapshot.estadoFinancieroObra.notas || '—']
        ]
      });
    }

    const xml = this.buildExcelXml(sheets);
    this.downloadExcel(xml, `reportes-${this.timestamp()}.xls`);
  }

  private buildEntidadBody(options: EntidadPdfOptions) {
    const entidad = options.entidad as any;
    const base = [
      ['Nombre', entidad.nombre],
      ['Contacto', entidad.contacto || '—'],
      ['Teléfono', entidad.telefono || '—'],
      ['Email', entidad.email || '—']
    ];
    if ((entidad as Cliente).cuit) {
      base.push(['CUIT', (entidad as Cliente).cuit || '—']);
    }
    base.push(['Estado', entidad.activo ? 'Activo' : 'Inactivo']);
    return base;
  }

  private drawHeader(doc: jsPDF, title: string, subtitle?: string): number {
    const width = doc.internal.pageSize.getWidth();
    doc.setFillColor(this.brandColor.r, this.brandColor.g, this.brandColor.b);
    doc.rect(0, 0, width, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('MELIQUINA', 14, 18);
    doc.setFontSize(12);
    doc.text('CONSTRUCCIONES', 14, 27);

    doc.setFontSize(16);
    doc.text(title, width - 14, 18, {align: 'right'});
    if (subtitle) {
      doc.setFontSize(11);
      doc.text(subtitle, width - 14, 27, {align: 'right'});
    }

    doc.setTextColor(33, 33, 33);
    doc.setFont('helvetica', 'normal');
    return 44;
  }

  private drawSectionTitle(doc: jsPDF, title: string, cursor: number): number {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(title, 14, cursor);
    return cursor + 4;
  }

  private drawEmptyMessage(doc: jsPDF, cursor: number, message: string): number {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(message, 14, cursor + 6);
    return cursor + 14;
  }

  private addFooter(doc: jsPDF) {
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(this.brandColor.r, this.brandColor.g, this.brandColor.b);
    doc.setLineWidth(0.5);
    doc.line(14, height - 15, doc.internal.pageSize.getWidth() - 14, height - 15);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Meliquina Construcciones', 14, height - 8);
    doc.text(`Generado: ${this.formatDate(new Date())}`, doc.internal.pageSize.getWidth() - 14, height - 8, {align: 'right'});
  }

  private formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return '—';
    return this.currencyFormatter.format(value);
  }

  private formatDate(value?: string | Date | null): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return this.dateFormatter.format(date);
  }

  private tableHeadStyle(): Partial<Styles> {
    return {
      fillColor: [this.brandColor.r, this.brandColor.g, this.brandColor.b] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold'
    };
  }

  private isPendienteMovimiento(transaccion: Transaccion): boolean {
    const forma = (transaccion.forma_pago || (transaccion as any).parcial_o_total || '').toString().toLowerCase();
    return forma.includes('parcial') || forma.includes('pendiente');
  }

  private buildExcelXml(sheets: ExcelSheetDefinition[]): string {
    const header = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>`;
    const workbookStart = `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;
    const styles = `<Styles><Style ss:ID="sHeader"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="${this.brandColor.hex}" ss:Pattern="Solid"/></Style></Styles>`;
    const worksheets = sheets.map(sheet => {
      const headerRow = `<Row ss:StyleID="sHeader">${sheet.headers.map(value => this.excelCell(value)).join('')}</Row>`;
      const rows = sheet.rows.map(row => `<Row>${row.map(value => this.excelCell(value)).join('')}</Row>`).join('');
      return `<Worksheet ss:Name="${this.escapeXml(sheet.name)}"><Table>${headerRow}${rows}</Table></Worksheet>`;
    }).join('');
    return `${header}${workbookStart}${styles}${worksheets}</Workbook>`;
  }

  private excelCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '<Cell><Data ss:Type="String"></Data></Cell>';
    }
    const isNumber = typeof value === 'number' && !Number.isNaN(value);
    const escaped = this.escapeXml(value.toString());
    return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escaped}</Data></Cell>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private downloadExcel(xml: string, filename: string) {
    const blob = new Blob([xml], {type: 'application/vnd.ms-excel'});
    this.saveBlob(blob, filename);
  }

  private saveBlob(blob: Blob, filename: string) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private slug(value: string): string {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return sanitized || 'documento';
  }

  private timestamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  }

}
