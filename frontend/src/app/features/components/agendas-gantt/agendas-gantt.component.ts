import {Component, OnInit, OnDestroy, signal, computed, inject, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {Subscription} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {SelectModule} from 'primeng/select';
import {InputTextModule} from 'primeng/inputtext';

import {Agenda, ESTADOS_AGENDA_OPCIONES, Obra, Cliente, Proveedor} from '../../../core/models/models';
import {AgendasService} from '../../../services/agendas/agendas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {AgendaModalComponent} from '../agendas-list/agenda-modal/agenda-modal.component';

interface GanttRow {
  agenda: Agenda;
  obraNombre: string;
  tooltipText: string;
  startPercent: number;
  widthPercent: number;
  hasBar: boolean;
  dotClass: string;
  barClass: string;
}

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-agendas-gantt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    SelectModule,
    InputTextModule,
    AgendaModalComponent
  ],
  providers: [MessageService],
  templateUrl: './agendas-gantt.component.html',
  styleUrls: ['./agendas-gantt.component.css']
})
export class AgendasGanttComponent implements OnInit, OnDestroy {
  @Input() modoEmbebido = false;
  @Output() volverALista = new EventEmitter<void>();

  private agendasService = inject(AgendasService);
  private obrasService = inject(ObrasService);
  private clientesService = inject(ClientesService);
  private proveedoresService = inject(ProveedoresService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private elRef = inject(ElementRef);
  private subscription = new Subscription();

  agendas = signal<Agenda[]>([]);
  obras = signal<Obra[]>([]);
  clientes = signal<Cliente[]>([]);
  proveedores = signal<Proveedor[]>([]);
  datosCargados = signal(false);

  mostrarModal = signal(false);
  agendaSeleccionada = signal<Agenda | null>(null);

  yearSelected = signal(new Date().getFullYear());
  viewMode = signal<'month' | 'week'>('week');
  searchValue = signal('');
  estadoFiltro = signal<string[]>([]);
  estadoSeleccionado = signal<string | null>(null);

  readonly estadosOptions = ESTADOS_AGENDA_OPCIONES.map(e => ({label: e.label, value: e.name}));

  private ganttStart = computed(() => {
    if (this.viewMode() === 'week') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(this.yearSelected(), 0, 1);
  });

  private ganttEnd = computed(() => {
    if (this.viewMode() === 'week') {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      d.setDate(d.getDate() + 6);
      return d;
    }
    return new Date(this.yearSelected(), 11, 31, 23, 59, 59);
  });

  private totalMs = computed(() => this.ganttEnd().getTime() - this.ganttStart().getTime());

  months = computed(() =>
    MONTH_NAMES_SHORT.map((name, i) => {
      const mStart = new Date(this.yearSelected(), i, 1);
      const mEnd = new Date(this.yearSelected(), i + 1, 0, 23, 59, 59);
      const left = ((mStart.getTime() - this.ganttStart().getTime()) / this.totalMs()) * 100;
      const width = ((mEnd.getTime() - mStart.getTime()) / this.totalMs()) * 100;
      return {name, left, width, index: i};
    })
  );

  private readonly DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  days = computed(() => {
    const start = this.ganttStart();
    const total = this.totalMs();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Array.from({length: 7}, (_, i) => {
      const dayStart = new Date(start.getTime() + i * msPerDay);
      const left = (i / 7) * 100;
      const width = 100 / 7;
      return {
        label: `${this.DAY_NAMES[dayStart.getDay()]} ${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
        left,
        width,
        month: dayStart.getMonth()
      };
    });
  });

  todayPercent = computed(() => {
    const now = new Date();
    const s = this.ganttStart();
    const e = this.ganttEnd();
    if (now < s || now > e) return -1;
    return ((now.getTime() - s.getTime()) / this.totalMs()) * 100;
  });

  ganttRows = computed<GanttRow[]>(() => {
    const search = this.searchValue().toLowerCase();
    const estados = this.estadoFiltro();
    const obras = this.obras();
    const start = this.ganttStart();
    const total = this.totalMs();

    const dotClasses: Record<string, string> = {
      'PENDIENTE': 'dot-pendiente',
      'EN_PROGRESO': 'dot-en-progreso',
      'COMPLETADA': 'dot-completada'
    };
    const barClasses: Record<string, string> = {
      'PENDIENTE': 'bar-pendiente',
      'EN_PROGRESO': 'bar-en-progreso',
      'COMPLETADA': 'bar-completada'
    };

    return this.agendas()
      .filter(a => {
        if (search && !a.titulo.toLowerCase().includes(search) && !(a.descripcion?.toLowerCase().includes(search))) return false;
        if (estados.length && !estados.includes(a.estado)) return false;
        return true;
      })
      .sort((a, b) => {
        const fa = a.fechaInicio ? new Date(a.fechaInicio).getTime() : Infinity;
        const fb = b.fechaInicio ? new Date(b.fechaInicio).getTime() : Infinity;
        return fa - fb;
      })
      .map(a => {
        const obra = obras.find(o => o.id === a.obraId);
        const fechaI = a.fechaInicio ? new Date(a.fechaInicio) : null;
        const fechaV = a.fechaVencimiento ? new Date(a.fechaVencimiento) : null;

        let startPercent = 0;
        let widthPercent = 0;
        let hasBar = false;

        if (fechaI || fechaV) {
          const barStart = fechaI ?? fechaV!;
          const barEnd = fechaV ?? fechaI!;
          const rawStart = ((barStart.getTime() - start.getTime()) / total) * 100;
          const rawEnd = ((barEnd.getTime() - start.getTime()) / total) * 100;
          const clampedStart = Math.max(0, rawStart);
          const clampedEnd = Math.min(100, Math.max(rawEnd, rawStart + (1 / total * 86400000 * 100)));
          startPercent = clampedStart;
          widthPercent = Math.max(0.4, clampedEnd - clampedStart);
          hasBar = clampedEnd > 0 && clampedStart < 100;
        }

        const iStr = fechaI ? fechaI.toLocaleDateString('es-AR') : 'Sin inicio';
        const vStr = fechaV ? fechaV.toLocaleDateString('es-AR') : 'Sin vencimiento';

        return {
          agenda: a,
          obraNombre: obra?.nombre || '',
          tooltipText: `${a.titulo} | ${iStr} → ${vStr}`,
          startPercent,
          widthPercent,
          hasBar,
          dotClass: dotClasses[a.estado] || 'dot-pendiente',
          barClass: barClasses[a.estado] || 'bar-pendiente'
        };
      });
  });

  resumen = computed(() => {
    const rows = this.ganttRows();
    return {
      total: rows.length,
      pendiente: rows.filter(r => r.agenda.estado === 'PENDIENTE').length,
      enProgreso: rows.filter(r => r.agenda.estado === 'EN_PROGRESO').length,
      completada: rows.filter(r => r.agenda.estado === 'COMPLETADA').length
    };
  });

  ngOnInit() {
    this.cargarDatos();
    this.subscription.add(
      this.agendasService.crearNuevaAgenda$.subscribe(() => this.abrirModalCrear())
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSearchInput(event: Event) {
    this.searchValue.set((event.target as HTMLInputElement).value);
  }

  onEstadoChange(value: string | null) {
    this.estadoSeleccionado.set(value);
    this.estadoFiltro.set(value ? [value] : []);
  }

  onClearFilters() {
    this.searchValue.set('');
    this.estadoSeleccionado.set(null);
    this.estadoFiltro.set([]);
  }

  private cargarDatos() {
    this.subscription.add(
      this.obrasService.getObrasAll().subscribe({next: o => this.obras.set(o), error: () => {}})
    );
    this.subscription.add(
      this.clientesService.getClientes().subscribe({next: c => this.clientes.set(c), error: () => {}})
    );
    this.subscription.add(
      this.proveedoresService.getProveedores().subscribe({next: p => this.proveedores.set(p), error: () => {}})
    );
    this.subscription.add(
      this.agendasService.getAgendas().subscribe({
        next: (agendas) => {
          this.agendas.set(agendas);
          this.datosCargados.set(true);
          this.autoSetYear(agendas);
        },
        error: () => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las agendas'});
          this.datosCargados.set(true);
        }
      })
    );
  }

  private autoSetYear(agendas: Agenda[]) {
    const currentYear = new Date().getFullYear();
    const years = agendas
      .flatMap(a => [a.fechaInicio, a.fechaVencimiento])
      .filter(Boolean)
      .map(f => new Date(f!).getFullYear())
      .filter(y => !isNaN(y));
    if (years.length === 0 || years.includes(currentYear)) return;
    const counts = years.reduce((acc, y) => ({...acc, [y]: (acc[y] || 0) + 1}), {} as Record<number, number>);
    const mostCommon = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    this.yearSelected.set(mostCommon);
  }

  prevYear() {this.yearSelected.update(y => y - 1);}
  nextYear() {this.yearSelected.update(y => y + 1);}
  navegarALista() {
    if (this.modoEmbebido) {
      this.volverALista.emit();
    } else {
      this.router.navigate(['/agendas']);
    }
  }
  toggleViewMode(mode: 'month' | 'week') {this.viewMode.set(mode);}

  abrirModalCrear() {
    this.agendaSeleccionada.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalDetalle(agenda: Agenda) {
    this.agendaSeleccionada.set(agenda);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.agendaSeleccionada.set(null);
  }

  onAgendaGuardada(agenda: Agenda) {
    const idx = this.agendas().findIndex(a => a.id === agenda.id);
    if (idx > -1) {
      const arr = [...this.agendas()];
      arr[idx] = agenda;
      this.agendas.set(arr);
    } else {
      this.agendas.set([...this.agendas(), agenda]);
    }
    this.cerrarModal();
  }

  onAgendaEliminada(id: number) {
    this.agendas.set(this.agendas().filter(a => a.id !== id));
    this.cerrarModal();
  }

  getEstadoLabel(estado: string): string {
    return ESTADOS_AGENDA_OPCIONES.find(e => e.name === estado)?.label || estado;
  }

  async exportarPDF() {
    const outerEl    = this.elRef.nativeElement.querySelector('.gantt-outer') as HTMLElement;
    const wrapperEl  = this.elRef.nativeElement.querySelector('.gantt-scroll-wrapper') as HTMLElement;
    const tableEl    = this.elRef.nativeElement.querySelector('.gantt-table') as HTMLElement;
    if (!outerEl || !wrapperEl || !tableEl) return;

    const fecha = new Date().toLocaleDateString('es-AR');
    const modo = this.viewMode() === 'week' ? 'Semanal' : `Año ${this.yearSelected()}`;
    const estadoFiltro = this.estadoSeleccionado() ? ` · Estado: ${this.getEstadoLabel(this.estadoSeleccionado()!)}` : '';
    const busqueda = this.searchValue() ? ` · Búsqueda: "${this.searchValue()}"` : '';

    // Inyectar estilos temporales para captura correcta
    const tmpStyle = document.createElement('style');
    tmpStyle.id = 'gantt-pdf-capture';
    tmpStyle.textContent = `
      .gantt-label-col { position: relative !important; overflow: visible !important; }
      .gantt-data-row { height: 52px !important; min-height: 52px !important; max-height: 52px !important; }
      .gantt-header-row { height: 44px !important; min-height: 44px !important; max-height: 44px !important; }
      .gantt-timeline-col { overflow: visible !important; }
      .task-name-wrapper { overflow: visible !important; height: 100% !important; }
      .task-title { overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; font-size: 0.7rem !important; }
      .task-sub   { overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; font-size: 0.65rem !important; }
      .gantt-outer, .gantt-scroll-wrapper, .gantt-table { overflow: visible !important; max-height: none !important; }
    `;
    document.head.appendChild(tmpStyle);

    let canvas: HTMLCanvasElement;
    try {
      // Forzar reflow sincrónico
      void tableEl.getBoundingClientRect();
      await new Promise(r => setTimeout(r, 50));

      const fullW = tableEl.scrollWidth;
      const fullH = tableEl.scrollHeight;

      canvas = await html2canvas(tableEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: fullW,
        height: fullH,
        windowWidth: fullW,
        ignoreElements: el => el.classList.contains('today-line')
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el PDF del diagrama'
      });
      return;
    } finally {
      document.head.removeChild(tmpStyle);
    }

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'});

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const headerH = 22;

    doc.setFontSize(14);
    doc.text('Diagrama de Gantt — Agenda', margin, 12);
    doc.setFontSize(9);
    doc.text(`Vista: ${modo}${estadoFiltro}${busqueda}   |   Exportado: ${fecha}`, margin, 19);

    const availW = pageW - margin * 2;
    const availH = pageH - headerH - margin;
    const ratio = canvas.width / canvas.height;
    let imgW = availW;
    let imgH = imgW / ratio;
    if (imgH > availH) {
      imgH = availH;
      imgW = imgH * ratio;
    }

    doc.addImage(imgData, 'PNG', margin, headerH, imgW, imgH);

    // Tabla de especificación debajo del diagrama
    const tableStartY = headerH + imgH + 8;
    const rows = this.ganttRows().map(r => [
      r.agenda.titulo,
      r.obraNombre || '-',
      r.agenda.fechaInicio ? new Date(r.agenda.fechaInicio).toLocaleDateString('es-AR') : '-',
      r.agenda.fechaVencimiento ? new Date(r.agenda.fechaVencimiento).toLocaleDateString('es-AR') : '-',
      this.getEstadoLabel(r.agenda.estado),
      r.agenda.prioridad || '-'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Título', 'Obra', 'Fecha Inicio', 'Vencimiento', 'Estado', 'Prioridad']],
      body: rows,
      styles: {fontSize: 7.5},
      headStyles: {fillColor: [59, 130, 246]},
      alternateRowStyles: {fillColor: [245, 247, 250]},
      margin: {left: margin, right: margin}
    });

    doc.save(`gantt-agendas-${fecha.replace(/\//g, '-')}.pdf`);
  }
}
