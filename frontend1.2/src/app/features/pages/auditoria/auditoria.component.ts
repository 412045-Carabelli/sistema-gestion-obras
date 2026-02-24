import {Component, Signal, signal, inject} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {debounceTime, finalize, startWith, switchMap, tap} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {MultiSelectModule} from 'primeng/multiselect';
import {DatePicker} from 'primeng/datepicker';
import {AuditoriaService, AuditLog, AuditFilter} from '../../../services/auditoria/auditoria.service';
import {GenericTableComponent, GenericColumn} from '../../../shared/generic-table/generic-table.component';
import {ModalComponent} from '../../../shared/modal/modal.component';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    MultiSelectModule,
    DatePicker,
    GenericTableComponent,
    ModalComponent
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent {
  private fb = inject(FormBuilder);

  filtrosForm: FormGroup = this.fb.group({
    tipo: [[]],
    rangoFechas: [null],
    search: ['']
  });

  loading = signal(false);
  audits: Signal<AuditLog[]> = toSignal(
    this.filtrosForm.valueChanges.pipe(
      startWith(this.filtrosForm.value),
      debounceTime(300),
      tap(() => this.loading.set(true)),
      switchMap((value) =>
        this.auditoriaService.getAudits(this.buildFilterFromValue(value)).pipe(
          finalize(() => this.loading.set(false))
        )
      )
    ),
    {initialValue: []}
  );

  tipoRequestOptions: SelectOption<string>[] = [
    {label: 'POST', value: 'POST'},
    {label: 'PUT', value: 'PUT'},
    {label: 'PATCH', value: 'PATCH'},
    {label: 'DELETE', value: 'DELETE'}
  ];

  columns: GenericColumn<AuditLog>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      value: (row) => row.fechaHora,
      format: (value) => this.formatDateTime(value)
    },
    {key: 'modulo', header: 'Módulo', field: 'modulo'},
    {
      key: 'tipo',
      header: 'Tipo',
      type: 'tag',
      value: (row) => row.tipoRequest,
      tagValue: (row) => row.tipoRequest || '-',
      tagSeverity: (row) => this.getSeverity(row.tipoRequest)
    },
    {key: 'endpoint', header: 'Endpoint', field: 'endpoint', truncate: true},
    {key: 'tabla', header: 'Tabla', field: 'tablaModificada'},
    {key: 'codigo', header: 'Código', field: 'codigoRespuesta'},
    {key: 'usuario', header: 'Usuario', field: 'usuario'},
    {key: 'ip', header: 'IP', field: 'ip'},
    {key: 'respuesta', header: 'Respuesta', field: 'respuesta', truncate: true}
  ];

  modalVisible = signal(false);
  selectedAudit = signal<AuditLog | null>(null);

  constructor(private auditoriaService: AuditoriaService) {}

  clearFilters(): void {
    this.filtrosForm.reset({
      tipo: [],
      rangoFechas: null,
      search: ''
    }, {emitEvent: false});
  }

  private buildFilterFromValue(value: any): AuditFilter | undefined {
    const {tipo, rangoFechas, search} = value || {};
    const filter: AuditFilter = {};

    if (Array.isArray(tipo) && tipo.length > 0) {
      // En backend solo hay un param "tipo", enviamos el primero por ahora.
      filter.tipo = tipo[0];
    }
    if (search && search.trim()) {
      const value = search.trim();
      const codigo = Number(value);
      const isCodigo = Number.isFinite(codigo) && value !== '';
      if (isCodigo) {
        filter.codigo = codigo;
      }
      filter.creador = value;
      filter.endpoint = value;
      filter.tabla = value;
      filter.modulo = value;
    }

    if (rangoFechas && Array.isArray(rangoFechas)) {
      const [inicio, fin] = rangoFechas;
      if (inicio) filter.desde = this.toStartOfDayIso(inicio);
      if (fin) filter.hasta = this.toEndOfDayIso(fin);
    }

    return Object.keys(filter).length ? filter : undefined;
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'dd/MM/yyyy HH:mm', 'es-AR');
  }

  getSeverity(tipo?: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
    const t = (tipo || '').toUpperCase();
    if (t === 'POST') return 'success';
    if (t === 'PUT') return 'info';
    if (t === 'PATCH') return 'warn';
    if (t === 'DELETE') return 'danger';
    return undefined;
  }

  private toStartOfDayIso(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private toEndOfDayIso(date: Date): string {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  openAuditDetail(row: AuditLog): void {
    const id = Number(row?.id ?? 0);
    if (!id) return;
    this.auditoriaService.getAuditById(id, row?.modulo || undefined).subscribe({
      next: (detail) => {
        this.selectedAudit.set(detail || row);
        this.modalVisible.set(true);
      },
      error: () => {
        this.selectedAudit.set(row);
        this.modalVisible.set(true);
      }
    });
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  formatJson(value?: string): string {
    if (!value) return '-';
    try {
      const obj = JSON.parse(value);
      return JSON.stringify(obj, null, 2);
    } catch {
      return value;
    }
  }
}
