import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CommonModule, CurrencyPipe, DatePipe, NgClass} from '@angular/common';
import {forkJoin, Subscription} from 'rxjs';

import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressBarModule} from 'primeng/progressbar';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {Select} from 'primeng/select';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';

import {Cliente, EstadoObra, Obra, ObraCosto, Proveedor, Tarea, CuentaCorrienteMovimiento} from '../../../core/models/models';
import {ObraMovimientosComponent} from '../../components/obra-movimientos/obra-movimientos.component';
import {ObraTareasComponent} from '../../components/obra-tareas/obra-tareas.component';

import {ObrasService} from '../../../services/obras/obras.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {ObraDocumentosComponent} from '../../components/obra-documentos/obra-documentos.component';

import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasStateService} from '../../../services/obras/obras-state.service';
import {StyleClassModule} from 'primeng/styleclass';
import {ObraPresupuestoComponent} from '../../components/obra-presupuesto/obra-presupuesto.component';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {CuentaCorrienteObraResponse, ReportFilter} from '../../../core/models/models';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    DropdownModule,
    ObraMovimientosComponent,
    ObraTareasComponent,
    ObraPresupuestoComponent,
    CurrencyPipe,
    DatePipe,
    Select,
    FormsModule,
    ToastModule,
    ObraDocumentosComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StyleClassModule,
    NgClass,
  ],
  providers: [MessageService],
  templateUrl: './obras-detail.component.html',
  styleUrls: ['./obras-detail.component.css']
})
export class ObrasDetailComponent implements OnInit, OnDestroy {

  @ViewChild('movimientosRef') movimientosRef?: ObraMovimientosComponent;

  obra!: Obra;
  tareas: Tarea[] = [];
  costos: ObraCosto[] = [];
  proveedores!: Proveedor[];
  clientes!: Cliente[];
  cuentaCorrienteObra: CuentaCorrienteObraResponse | null = null;
  progresoFisico = 0;
  estadosObra: EstadoObra[] = [];
  estadoSeleccionado: string | null = null;
  beneficioNeto = 0;
  beneficioCostos = 0;
  cronogramaFueraDeRango = false;

  loading = true;
  private subs = new Subscription();
  private pdfMakeInstance?: any;
  private pdfMakeLoader?: Promise<any>;

  constructor(
    private route: ActivatedRoute,
    private obraService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private messageService: MessageService,
    private obraStateService: ObrasStateService,
    private reportesService: ReportesService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.obraStateService.clearObra();
  }

  actualizarEstadoObra(nuevoEstado: string) {
    console.log(nuevoEstado)
    this.obraService.updateEstadoObra(this.obra.id!, nuevoEstado).subscribe({
      next: () => {
        const encontrado = this.estadosObra.find(e => e.name === nuevoEstado);
        if (encontrado) {
          this.obra.obra_estado = encontrado.label;
        }

        if (nuevoEstado?.toUpperCase() === 'ADJUDICADA') {
          this.obra.fecha_adjudicada = new Date().toISOString();
        }

        this.estadoSeleccionado = nuevoEstado;
        this.obraStateService.setObra(this.obra);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: 'La obra ahora esta en estado "' + this.obra.obra_estado + '".'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Estado actualizado',
          detail: 'El estado de la obra no se pudo actualizar',
        })
      }
    });
  }

  private cargarDetalle(idObra: number) {
    this.loading = true;

    forkJoin({
      obra: this.obraService.getObraById(idObra),
      estados: this.estadoObraService.getEstados(),
      proveedores: this.proveedoresService.getProveedores(),
      clientes: this.clientesService.getClientes(),
    }).subscribe({

      next: ({ obra, estados, proveedores, clientes }) => {
        console.log(obra)
        this.obra = { ...obra, id: Number(obra.id) };
        this.tareas = obra.tareas ?? [];
        this.costos = obra.costos ?? [];
        this.estadosObra = estados;

        this.estadoSeleccionado = obra.obra_estado;

        this.clientes = clientes;

        // Mantener todos los proveedores disponibles para permitir sumar costos nuevos
        this.proveedores = proveedores;

        this.progresoFisico = this.getProgresoFisico();
        this.beneficioCostos = obra.beneficio_costos != null
          ? Number(obra.beneficio_costos)
          : this.calcularBeneficioCostos(this.costos);
        this.beneficioNeto = obra.beneficio_neto != null
          ? Number(obra.beneficio_neto)
          : this.calcularBeneficioNeto();
        this.cronogramaFueraDeRango = this.esCronogramaInvalido();
        this.cargarCuentaCorriente(this.obra.id!);
        this.loading = false;
        this.obraStateService.setObra(this.obra);
      },

      error: () => {
        this.loading = false;
        this.obraStateService.clearObra();
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar la obra',
          detail: 'No se pudo obtener la informacion de la obra.'
        });
      }
    });
  }

  onCostosActualizados(costosActualizados: ObraCosto[]) {
    this.costos = costosActualizados;
    this.obra.costos = costosActualizados;
    this.beneficioCostos = this.calcularBeneficioCostos(costosActualizados);
    this.beneficioNeto = this.calcularBeneficioNeto();
    this.obra.beneficio_costos = this.beneficioCostos;
    this.obra.beneficio_neto = this.beneficioNeto;
    this.obraStateService.setObra(this.obra);
  }

  refrescarMovimientos() {
    this.movimientosRef?.cargarDatos();
  }

  getProgresoFisico(): number {
    if (!this.tareas.length) return 0;
    const completadas = this.tareas.filter(t => (t.estado_tarea || '').toUpperCase() === 'COMPLETADA');
    const total = completadas.reduce((acc, t) => acc + Number(t.porcentaje ?? 0), 0);
    return Math.min(Math.round(total), 100);
  }

  private calcularBeneficioNeto(): number {
    const costos = this.obra.costos ?? [];
    const subtotalBase = (costos ?? []).reduce(
      (acc, c) =>
        acc +
        Number(
          c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
        ),
      0
    );

    const beneficioCostos = this.calcularBeneficioCostos(costos);
    const totalConBeneficio = subtotalBase + beneficioCostos;

    const comisionPorc = this.obra.tiene_comision ? Number(this.obra.comision ?? 0) : 0;
    const comisionMonto = totalConBeneficio * (comisionPorc / 100);

    return beneficioCostos - comisionMonto;
  }

  private calcularBeneficioCostos(costos: ObraCosto[]): number {
    const beneficioGlobalPorc = this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : null;
    return (costos ?? []).reduce((acc, costo) => {
      const base = Number(
        costo.subtotal ??
        (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0))
      );

      const esAdicional =
        (costo?.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';

      const porc = esAdicional
        ? Number(costo.beneficio ?? 0)
        : (beneficioGlobalPorc !== null ? beneficioGlobalPorc : Number(costo.beneficio ?? 0));

      return acc + base * (porc / 100);
    }, 0);
  }

  private esCronogramaInvalido(): boolean {
    const inicio = this.obra.fecha_inicio ? new Date(this.obra.fecha_inicio) : null;
    const fin = this.obra.fecha_fin ? new Date(this.obra.fecha_fin) : null;
    if (!inicio || !fin) return false;
    return fin.getTime() < inicio.getTime();
  }

  private cargarCuentaCorriente(obraId: number) {
    const filtro: ReportFilter = {obraId};
    this.reportesService.getCuentaCorrienteObra(filtro).subscribe({
      next: (data) => this.cuentaCorrienteObra = data,
      error: () => this.cuentaCorrienteObra = null
    });
  }

  onTareasActualizadas(nuevasTareas: Tarea[]) {
    this.tareas = nuevasTareas;
    this.obra.tareas = nuevasTareas;

    // Recalcular progreso con los nuevos estados
    this.progresoFisico = this.getProgresoFisico();

    // Guardar estado en el service global
    this.obraStateService.setObra(this.obra);

    // Opcional: mostrar un toast
    this.messageService.add({
      severity: 'success',
      summary: 'Tareas actualizadas',
      detail: 'Se actualizaron correctamente las tareas de esta obra.'
    });
  }

  toggleActivo() {
    this.obraService.activarObra(this.obra.id!).subscribe({
      next: () => {
        this.obra.activo = !this.obra.activo;
        this.obraStateService.setObra(this.obra);
        this.messageService.add({
          severity: 'success',
          summary: this.obra.activo ? 'Obra activada' : 'Obra desactivada',
          detail: `La obra fue ${this.obra.activo ? 'activada' : 'desactivada'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la obra.'
        });
      }
    });
  }

  async exportarResumenPdf() {
    if (!this.obra) return;

    const pdfMake = await this.loadPdfMake();
    const logoDataUrl = await this.obtenerLogoDataUrl();
    const fechaHoy = new Date().toLocaleDateString('es-AR');
    const cliente = this.obra.cliente;

    const formatCurrency = (valor: number) =>
      (valor || 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'});

    const filasCostos = (this.costos ?? []).map(c => {
      const subtotalBase = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const beneficioAplicado = esAdicional
        ? Number(c.beneficio ?? 0)
        : (this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : Number(c.beneficio ?? 0));
      const totalConBeneficio = subtotalBase * (1 + beneficioAplicado / 100);

      return [
        {text: c.descripcion, fontSize: 9},
        {text: c.proveedor?.nombre ?? '-', fontSize: 9},
        {text: formatCurrency(subtotalBase), fontSize: 9, alignment: 'right'},
        {text: formatCurrency(totalConBeneficio), fontSize: 9, alignment: 'right'},
        {text: c.estado_pago ?? '-', alignment: 'center', fontSize: 9}
      ];
    });

    const subtotalCostos = (this.costos ?? []).reduce(
      (acc, c) => acc + Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))),
      0
    );
    const beneficioCostos = (this.costos ?? []).reduce((acc, c) => {
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const beneficio = esAdicional
        ? Number(c.beneficio ?? 0)
        : (this.obra.beneficio_global ? Number(this.obra.beneficio ?? 0) : Number(c.beneficio ?? 0));
      const base = Number(c.subtotal ?? (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0)));
      return acc + base * (beneficio / 100);
    }, 0);
    const totalCostos = subtotalCostos + beneficioCostos;
    const comisionPorc = this.obra.tiene_comision ? Number(this.obra.comision ?? 0) : 0;
    const comisionMonto = totalCostos * (comisionPorc / 100);
    const totalCostosConComision = totalCostos + comisionMonto;

    const tareasPendientes = (this.tareas ?? []).filter(t => {
      const estado = (t.estado_tarea || '').toUpperCase();
      return estado !== 'COMPLETADA' && estado !== 'EN_PROGRESO';
    });
    const tareasEnProgreso = (this.tareas ?? []).filter(
      t => (t.estado_tarea || '').toUpperCase() === 'EN_PROGRESO'
    );
    const tareasCompletadas = (this.tareas ?? []).filter(
      t => (t.estado_tarea || '').toUpperCase() === 'COMPLETADA'
    );
    const tareaTexto = (t: Tarea) =>
      [
        `Proveedor: ${this.nombreProveedorTarea(t)}`,
        `Título: ${t.nombre}`,
        `Descripción: ${t.descripcion?.trim() || '-'}`,
      ].join('\n');
    const maxFilasTareas = Math.max(
      tareasPendientes.length,
      tareasEnProgreso.length,
      tareasCompletadas.length
    );
    const filasTareas = [];
    for (let i = 0; i < maxFilasTareas; i++) {
      filasTareas.push([
        {text: tareasPendientes[i] ? tareaTexto(tareasPendientes[i]) : '-', fontSize: 9},
        {text: tareasEnProgreso[i] ? tareaTexto(tareasEnProgreso[i]) : '-', fontSize: 9},
        {text: tareasCompletadas[i] ? tareaTexto(tareasCompletadas[i]) : '-', fontSize: 9}
      ]);
    }

    const cc = this.cuentaCorrienteObra;
    const movimientos = cc?.movimientos ?? [];
    const totalesIngresos = cc?.totalIngresos ?? 0;
    const totalesEgresos = cc?.totalEgresos ?? 0;
    const saldoFinal = cc?.saldoFinal ?? (totalesIngresos - totalesEgresos);
    const totalCobrosMov = movimientos
      .filter(m => (m.tipo || '').toUpperCase() === 'COBRO')
      .reduce((acc, m) => acc + (m.monto ?? 0), 0);
    const totalPagosMov = movimientos
      .filter(m => {
        const tipo = (m.tipo || '').toUpperCase();
        return tipo === 'PAGO' || tipo === 'COSTO';
      })
      .reduce((acc, m) => acc + (m.monto ?? 0), 0);
    const totalCobros = totalCobrosMov || totalesIngresos;
    const totalPagos = totalPagosMov || totalesEgresos;
    const saldoFinalTabla = totalCobros - totalPagos;

    const filasMov = movimientos.length
      ? movimientos.map(m => ([
          {text: m.fecha ? new Date(m.fecha).toLocaleDateString('es-AR') : '-', fontSize: 9},
          {text: m.tipo || '-', fontSize: 9},
          {text: m.concepto || m.referencia || '-', fontSize: 9},
          {text: this.nombreAsociadoMovimiento(m), fontSize: 9},
          {text: formatCurrency(m.monto ?? 0), alignment: 'right', fontSize: 9}
        ]))
      : [[
          {text: 'No hay movimientos registrados', colSpan: 5, alignment: 'center', fontSize: 9, italics: true},
          {}, {}, {}, {}
        ]];

    const saldoClienteFinal = obtenerSaldoFinal('saldoCliente') ?? saldoFinal;
    const saldoProveedorFinal = obtenerSaldoFinal('saldoProveedor') ?? 0;

    const docDefinition: any = {
      pageMargins: [20, 20, 20, 20],
      content: [
        logoDataUrl ? {image: logoDataUrl, width: 620, alignment: 'center', margin: [0, 0, 0, 12]} : {text: ''},
        {text: 'Resumen de Obra', alignment: 'center', fontSize: 16, bold: true},
        {text: fechaHoy, alignment: 'center', margin: [0, 0, 0, 10]},

        {text: 'Datos de la obra', style: 'sectionHeader'},
        {
          columns: [
            [
              {text: `Nombre: ${this.obra.nombre}`, margin: [0, 0, 0, 4]},
              {text: `Direccion: ${this.obra.direccion ?? '-'}`, margin: [0, 0, 0, 4]},
              {text: `Estado: ${this.formatearEstado(this.obra.obra_estado)}`, margin: [0, 0, 0, 4]},
              {text: `Inicio: ${this.obra.fecha_inicio ? new Date(this.obra.fecha_inicio).toLocaleDateString('es-AR') : '-'}`, margin: [0, 0, 0, 4]},
              {text: `Fin: ${this.obra.fecha_fin ? new Date(this.obra.fecha_fin).toLocaleDateString('es-AR') : '-'}`, margin: [0, 0, 0, 4]}
            ],
            [
              {text: `Presupuesto: ${(this.obra.presupuesto ?? 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}`, margin: [0, 0, 0, 6]},
              {text: `Comision: ${this.obra.comision ?? 0}% (${((this.obra.presupuesto || 0) * ((this.obra.comision ?? 0) / 100)).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})})`, margin: [0, 0, 0, 6]}
            ]
          ]
        },

        {text: '\nDatos del cliente', style: 'sectionHeader'},
        {
          columns: [
            [
              {text: cliente?.nombre ?? '-'},
              {text: `CUIT: ${cliente?.cuit ?? '-'}`},
              {text: `Email: ${cliente?.email ?? '-'}`},
              {text: `Telefono: ${cliente?.telefono ?? '-'}`}
            ]
          ]
        },

        {text: '\nCostos', style: 'sectionHeader'},
        {
          table: {
            widths: ['*', 120, 80, 80, 80],
            body: [
              [
                {text: 'Descripcion', bold: true},
                {text: 'Proveedor', bold: true},
                {text: 'Subtotal', bold: true, alignment: 'right'},
                {text: 'Total', bold: true, alignment: 'right'},
                {text: 'Estado', bold: true, alignment: 'center'}
              ],
              ...filasCostos
            ]
          }
        },
        {
          alignment: 'right',
          margin: [0, 6, 0, 12],
          table: {
            widths: ['*', 170],
            body: [
              ['Subtotal sin beneficio', formatCurrency(subtotalCostos)],
              ['Beneficio neto', formatCurrency(beneficioCostos)],
              ['Subtotal con beneficio', formatCurrency(totalCostos)],
              ['Comision', formatCurrency(comisionMonto)],
              ['Total costos', formatCurrency(totalCostosConComision)]
            ]
          },
          layout: 'noBorders'
        },

        {
          text: 'Tareas',
          style: 'sectionHeader',
          margin: [0, 10, 0, 4],
          pageBreak: 'before'
        },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                {text: `Pendientes (${tareasPendientes.length})`, bold: true, alignment: 'center'},
                {text: `En progreso (${tareasEnProgreso.length})`, bold: true, alignment: 'center'},
                {text: `Completadas (${tareasCompletadas.length})`, bold: true, alignment: 'center'}
              ],
              ...(filasTareas.length
                ? filasTareas
                : [[
                    {text: 'Sin tareas pendientes', italics: true, alignment: 'center', fontSize: 9},
                    {text: 'Sin tareas en progreso', italics: true, alignment: 'center', fontSize: 9},
                    {text: 'Sin tareas completadas', italics: true, alignment: 'center', fontSize: 9}
                  ]])
            ]
          }
        },

        {
          text: '\nMovimientos de la obra',
          style: 'sectionHeader',
          margin: [0, 10, 0, 4],
          pageBreak: 'before'
        },
        {
          table: {
            widths: [70, 50, '*', 110, 70],
            body: [
              [
                {text: 'Fecha', bold: true},
                {text: 'Tipo', bold: true},
                {text: 'Concepto', bold: true},
                {text: 'Asociado', bold: true},
                {text: 'Monto', bold: true, alignment: 'right'}
              ],
              ...filasMov
            ]
          }
        },

        {
          alignment: 'right',
          margin: [0, 6, 0, 0],
          table: {
            widths: ['*', 120],
            body: [
              ['Total cobros', formatCurrency(totalCobros)],
              ['Total pagos', formatCurrency(totalPagos)],
              ['Saldo final', formatCurrency(saldoFinalTabla)]
            ]
          },
          layout: 'noBorders'
        },

      ],
      styles: {
        sectionHeader: {fontSize: 12, bold: true, margin: [0, 10, 0, 4]}
      }
    };

    pdfMake.createPdf(docDefinition).download(`Resumen_Obra_${this.obra.id ?? ''}.pdf`);

    function obtenerSaldoFinal(campo: 'saldoCliente' | 'saldoProveedor'): number | null {
      const mov = [...movimientos].reverse().find(item => typeof item[campo] === 'number');
      return (mov?.[campo] as number | undefined) ?? null;
    }

    function descripcionSaldo(tipo: 'cliente' | 'proveedor', valor: number): string {
      if (valor > 0) {
        return tipo === 'cliente'
          ? 'Monto pendiente de cobro al cliente.'
          : 'Monto pendiente de pago al proveedor.';
      }
      if (valor < 0) {
        return tipo === 'cliente'
          ? `Tienes ${formatCurrency(Math.abs(valor))} a favor del cliente.`
          : `Tienes ${formatCurrency(Math.abs(valor))} a favor con el proveedor.`;
      }
      return 'Cuenta saldada.';
    }
  }

  private loadPdfMake(): Promise<any> {
    if (this.pdfMakeInstance) {
      return Promise.resolve(this.pdfMakeInstance);
    }
    if (!this.pdfMakeLoader) {
      this.pdfMakeLoader = Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts')
      ]).then(([pdfMakeModule, pdfFonts]) => {
        const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
        pdfMake.vfs = ((pdfFonts as any).default || pdfFonts as any).vfs;
        this.pdfMakeInstance = pdfMake;
        return pdfMake;
      });
    }
    return this.pdfMakeLoader;
  }

  private async obtenerLogoDataUrl(): Promise<string | undefined> {
    const base = window.location.origin;
    const candidates = [
      `${base}/assets/logo-meliquina.png`,
      `${base}/logo-meliquina.png`
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const blob = await response.blob();
        // eslint-disable-next-line no-await-in-loop
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Resultado de logo no es una cadena'));
          };
          reader.onerror = () => reject(new Error('No se pudo leer el logo'));
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      } catch {
        // probar siguiente
      }
    }
    console.error('No se pudo cargar el logo de la cotizacion', {candidates});
    return undefined;
  }

  private formatearEstado(estado?: string | null): string {
    if (!estado) return '-';
    return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  private nombreProveedorTarea(t: Tarea): string {
    if (t.proveedor?.nombre) return t.proveedor.nombre;
    if (t.id_proveedor) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(t.id_proveedor));
      if (prov) return prov.nombre;
    }
    return '-';
  }

  private nombreAsociado(tipo?: string, id?: number): string {
    if (!id) return '-';
    const t = (tipo || '').toString().toUpperCase();
    if (t === 'CLIENTE') {
      return this.clientes.find(c => Number(c.id) === Number(id))?.nombre ?? `Cliente #${id}`;
    }
    if (t === 'PROVEEDOR') {
      return this.proveedores?.find(p => Number(p.id) === Number(id))?.nombre ?? `Proveedor #${id}`;
    }
    return `#${id}`;
  }

  private nombreAsociadoMovimiento(mov: CuentaCorrienteMovimiento): string {
    const tipo = (mov.asociadoTipo || '').toUpperCase();
    const id = mov.asociadoId;

    if (tipo === 'PROVEEDOR' && id) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(id));
      if (prov?.nombre) return prov.nombre;
      return `Proveedor #${id}`;
    }

    if (tipo === 'CLIENTE') {
      if (id) {
        const cli = this.clientes?.find(c => Number(c.id) === Number(id));
        if (cli?.nombre) return cli.nombre;
      }
      // fallback al cliente de la obra
      if (this.obra?.cliente?.nombre) return this.obra.cliente.nombre;
      return id ? `Cliente #${id}` : 'Cliente';
    }

    // Fallback: si es un costo y no viene asociado, intentamos inferir proveedor por la descripcion del costo
    if ((mov.tipo || '').toUpperCase() === 'COSTO') {
      const proveedorInferido = this.proveedorPorConcepto(mov.concepto || mov.referencia || '');
      if (proveedorInferido) return proveedorInferido;
      return 'Proveedor';
    }

    // Fallback genérico: si es cobro sin asociado, asumimos cliente de la obra
    if ((mov.tipo || '').toUpperCase() === 'COBRO') {
      return this.obra?.cliente?.nombre || 'Cliente';
    }

    return tipo || '-';
  }

  private proveedorPorConcepto(concepto: string): string | null {
    if (!concepto || !this.obra?.costos?.length) return null;
    const match = this.obra.costos.find(c =>
      c.descripcion?.trim().toLowerCase() === concepto.trim().toLowerCase()
    );
    if (match?.proveedor?.nombre) return match.proveedor.nombre;
    if (match?.id_proveedor) {
      const prov = this.proveedores?.find(p => Number(p.id) === Number(match.id_proveedor));
      if (prov?.nombre) return prov.nombre;
    }
    return null;
  }
}
