import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {ToastModule} from 'primeng/toast';
import {MessageService, ConfirmationService} from 'primeng/api';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {SelectModule} from 'primeng/select';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextarea} from 'primeng/inputtextarea';

import {Obra, Proveedor, Tarea, TareaCronograma} from '../../../core/models/models';
import {ObrasService} from '../../../services/obras/obras.service';
import {TareasService, TareaPayload} from '../../../services/tareas/tareas.service';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {TableSkeletonComponent} from '../../../shared/table-skeleton/table-skeleton.component';
import {LayoutHeaderComponent} from '../../../shared/layout-header/layout-header.component';

interface GanttRow {
  tarea: TareaCronograma;
  tooltipText: string;
  startPercent: number;
  widthPercent: number;
  hasBar: boolean;
  dotClass: string;
  barClass: string;
}

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const OBRAS_SELECCIONABLES = 'ADJUDICADA,EN_PROGRESO';

@Component({
  selector: 'app-diagrama-gantt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule,
    InputTextarea,
    ModalComponent,
    TableSkeletonComponent,
    LayoutHeaderComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './diagrama-gantt.component.html',
  styleUrls: ['./diagrama-gantt.component.css']
})
export class DiagramaGanttComponent implements OnInit, OnDestroy {
  /** Cuando se setea (usado embebido en el tab de Tareas de una obra), acota el cronograma a esa obra
   * y oculta el membrete/selector de obra: la obra ya está fija. */
  @Input() obraId?: number;
  @Input() modoEmbebido = false;
  @Output() volverALista = new EventEmitter<void>();

  private obrasService = inject(ObrasService);
  private tareasService = inject(TareasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private subscription = new Subscription();

  tareas = signal<TareaCronograma[]>([]);
  obrasAdjudicadas = signal<Obra[]>([]);
  datosCargados = signal(false);

  yearSelected = signal(new Date().getFullYear());
  searchValue = signal('');
  obraFiltro = signal<number | null>(null);

  mostrarModal = signal(false);
  guardando = signal(false);
  tareaSeleccionada: TareaCronograma | null = null;
  obraSeleccionadaForm = signal<Obra | null>(null);
  proveedoresDeObraForm = signal<Array<{label: string; value: number}>>([]);
  cargandoProveedores = signal(false);
  form = {
    id: undefined as number | undefined,
    id_obra: null as number | null,
    id_proveedor: null as number | null,
    nombre: '',
    descripcion: '',
    fecha_inicio: '' as string,
    fecha_fin: '' as string
  };

  readonly obrasOptions = computed(() =>
    this.obrasAdjudicadas().map(o => ({label: o.nombre, value: o.id!}))
  );

  readonly obraFiltroOptions = computed(() => this.obrasOptions());

  private ganttStart = computed(() => new Date(this.yearSelected(), 0, 1));
  private ganttEnd = computed(() => new Date(this.yearSelected(), 11, 31, 23, 59, 59));
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

  todayPercent = computed(() => {
    const now = new Date();
    const s = this.ganttStart();
    const e = this.ganttEnd();
    if (now < s || now > e) return -1;
    return ((now.getTime() - s.getTime()) / this.totalMs()) * 100;
  });

  ganttRows = computed<GanttRow[]>(() => {
    const search = this.searchValue().toLowerCase();
    const obraFiltro = this.obraFiltro();
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

    return this.tareas()
      .filter(t => {
        if (obraFiltro && t.id_obra !== obraFiltro) return false;
        if (search && !t.nombre.toLowerCase().includes(search)
          && !(t.obra_nombre?.toLowerCase().includes(search))
          && !(t.proveedor_nombre?.toLowerCase().includes(search))
          && !(t.gremio_nombre?.toLowerCase().includes(search))) return false;
        return true;
      })
      .sort((a, b) => {
        const obraCmp = (a.obra_nombre || '').localeCompare(b.obra_nombre || '', 'es');
        if (obraCmp !== 0) return obraCmp;
        const fa = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : Infinity;
        const fb = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : Infinity;
        return fa - fb;
      })
      .map(t => {
        const fechaI = t.fecha_inicio ? new Date(t.fecha_inicio) : null;
        const fechaV = t.fecha_fin ? new Date(t.fecha_fin) : null;

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
        const vStr = fechaV ? fechaV.toLocaleDateString('es-AR') : 'Sin fin';
        const gremio = t.gremio_nombre ? ` (${t.gremio_nombre})` : '';

        return {
          tarea: t,
          tooltipText: `${t.nombre} — ${t.proveedor_nombre || 'Sin proveedor'}${gremio} | ${iStr} → ${vStr}`,
          startPercent,
          widthPercent,
          hasBar,
          dotClass: dotClasses[t.estado_tarea] || 'dot-pendiente',
          barClass: barClasses[t.estado_tarea] || 'bar-pendiente'
        };
      });
  });

  resumen = computed(() => {
    const rows = this.ganttRows();
    return {
      total: rows.length,
      pendiente: rows.filter(r => r.tarea.estado_tarea === 'PENDIENTE').length,
      enProgreso: rows.filter(r => r.tarea.estado_tarea === 'EN_PROGRESO').length,
      completada: rows.filter(r => r.tarea.estado_tarea === 'COMPLETADA').length
    };
  });

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private cargarDatos() {
    this.datosCargados.set(false);

    if (this.obraId) {
      // Embebido en el tab de Tareas de una obra: sin selector de obra, cronograma acotado a esta.
      this.subscription.add(
        this.tareasService.getTareasByObra(this.obraId).subscribe({
          next: tareas => {
            this.tareas.set(tareas.map(t => this.tareaATareaCronograma(t)));
            this.datosCargados.set(true);
            this.autoSetYear(this.tareas());
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las tareas del cronograma'});
            this.datosCargados.set(true);
          }
        })
      );
      return;
    }

    this.subscription.add(
      this.obrasService.getObrasSimple(OBRAS_SELECCIONABLES).subscribe({
        next: obras => this.obrasAdjudicadas.set(obras),
        error: () => {}
      })
    );
    this.subscription.add(
      this.tareasService.getTareasActivas().subscribe({
        next: tareas => {
          this.tareas.set(tareas);
          this.datosCargados.set(true);
          this.autoSetYear(tareas);
        },
        error: () => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las tareas del cronograma'});
          this.datosCargados.set(true);
        }
      })
    );
  }

  private tareaATareaCronograma(t: Tarea): TareaCronograma {
    return {
      id: t.id!,
      id_obra: t.id_obra,
      obra_nombre: t.obraNombre,
      id_proveedor: t.id_proveedor,
      proveedor_nombre: t.proveedor?.nombre,
      gremio_nombre: t.proveedor?.gremio,
      numero_orden: t.numero_orden,
      estado_tarea: t.estado_tarea,
      nombre: t.nombre,
      descripcion: t.descripcion,
      porcentaje: t.porcentaje,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin,
      creado_en: t.creado_en
    };
  }

  private autoSetYear(tareas: TareaCronograma[]) {
    const currentYear = new Date().getFullYear();
    const years = tareas
      .flatMap(t => [t.fecha_inicio, t.fecha_fin])
      .filter(Boolean)
      .map(f => new Date(f!).getFullYear())
      .filter(y => !isNaN(y));
    if (years.length === 0 || years.includes(currentYear)) return;
    const counts = years.reduce((acc, y) => ({...acc, [y]: (acc[y] || 0) + 1}), {} as Record<number, number>);
    const mostCommon = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    this.yearSelected.set(mostCommon);
  }

  prevYear() { this.yearSelected.update(y => y - 1); }
  nextYear() { this.yearSelected.update(y => y + 1); }

  onSearchInput(event: Event) {
    this.searchValue.set((event.target as HTMLInputElement).value);
  }

  onObraFiltroChange(value: number | null) {
    this.obraFiltro.set(value);
  }

  onClearFilters() {
    this.searchValue.set('');
    this.obraFiltro.set(null);
  }

  abrirModalCrear() {
    this.tareaSeleccionada = null;
    this.form = {
      id: undefined,
      id_obra: this.obraId ?? null,
      id_proveedor: null,
      nombre: '',
      descripcion: '',
      fecha_inicio: this.formatoFecha(new Date()),
      fecha_fin: ''
    };
    this.obraSeleccionadaForm.set(null);
    this.proveedoresDeObraForm.set([]);
    this.mostrarModal.set(true);
    if (this.obraId) {
      this.cargarProveedoresDeObra(this.obraId);
    }
  }

  abrirModalDetalle(row: GanttRow) {
    const t = row.tarea;
    this.tareaSeleccionada = t;
    this.form = {
      id: t.id,
      id_obra: t.id_obra,
      id_proveedor: t.id_proveedor ?? null,
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      fecha_inicio: t.fecha_inicio ? t.fecha_inicio.slice(0, 10) : '',
      fecha_fin: t.fecha_fin ? t.fecha_fin.slice(0, 10) : ''
    };
    this.mostrarModal.set(true);
    this.cargarProveedoresDeObra(t.id_obra);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.tareaSeleccionada = null;
  }

  onObraFormChange(idObra: number | null) {
    this.form.id_proveedor = null;
    this.proveedoresDeObraForm.set([]);
    if (idObra) {
      this.cargarProveedoresDeObra(idObra);
    }
  }

  /** Gremios/proveedores que intervienen en la obra elegida (los que tienen costos cargados ahí). */
  private cargarProveedoresDeObra(idObra: number) {
    this.cargandoProveedores.set(true);
    this.obrasService.getObraById(idObra).subscribe({
      next: obra => {
        this.obraSeleccionadaForm.set(obra);
        const map = new Map<number, Proveedor>();
        (obra.costos || []).forEach(c => {
          const id = c.proveedor?.id ?? c.id_proveedor;
          if (id && !map.has(id)) {
            map.set(id, c.proveedor ?? ({id, nombre: `Proveedor #${id}`} as Proveedor));
          }
        });
        const opciones = [...map.values()]
          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
          .map(p => ({label: this.etiquetaProveedor(p), value: p.id!}));
        this.proveedoresDeObraForm.set(opciones);
        this.cargandoProveedores.set(false);
      },
      error: () => {
        this.cargandoProveedores.set(false);
        this.messageService.add({severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar los proveedores de la obra'});
      }
    });
  }

  private etiquetaProveedor(p: Proveedor): string {
    return p.gremio ? `${p.nombre} (${p.gremio})` : p.nombre;
  }

  guardar() {
    if (!this.form.id_obra || !this.form.id_proveedor || !this.form.nombre.trim()) {
      this.messageService.add({severity: 'warn', summary: 'Validación', detail: 'Completá obra, proveedor y nombre de la tarea'});
      return;
    }
    if (this.form.fecha_inicio && this.form.fecha_fin && this.form.fecha_fin < this.form.fecha_inicio) {
      this.messageService.add({severity: 'warn', summary: 'Validación', detail: 'La fecha de fin no puede ser anterior a la de inicio'});
      return;
    }

    this.guardando.set(true);
    const payload: TareaPayload = {
      id: this.form.id,
      id_obra: this.form.id_obra,
      id_proveedor: this.form.id_proveedor,
      estado_tarea: this.tareaSeleccionada?.estado_tarea || 'PENDIENTE',
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion || undefined,
      fecha_inicio: this.form.fecha_inicio ? `${this.form.fecha_inicio}T00:00:00` : undefined,
      fecha_fin: this.form.fecha_fin ? `${this.form.fecha_fin}T00:00:00` : undefined
    };

    const operacion = this.form.id
      ? this.tareasService.updateTarea(this.form.id, payload)
      : this.tareasService.createTarea(payload);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.form.id ? 'Tarea actualizada' : 'Tarea creada',
          detail: `"${payload.nombre}" se guardó correctamente`
        });
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.error?.message || 'No se pudo guardar la tarea';
        this.messageService.add({severity: 'error', summary: 'Error', detail: msg});
      }
    });
  }

  eliminar() {
    if (!this.form.id) return;
    const id = this.form.id;
    this.confirmationService.confirm({
      message: '¿Eliminar esta tarea del cronograma?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.guardando.set(true);
        this.tareasService.deleteTarea(id, this.form.id_obra!).subscribe({
          next: () => {
            this.guardando.set(false);
            this.messageService.add({severity: 'success', summary: 'Eliminada', detail: 'La tarea fue eliminada'});
            this.cerrarModal();
            this.cargarDatos();
          },
          error: () => {
            this.guardando.set(false);
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la tarea'});
          }
        });
      }
    });
  }

  private formatoFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
