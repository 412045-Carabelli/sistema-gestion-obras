import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {Toast} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {GenericColumn, GenericTableComponent, RowAction} from '../../../shared/generic-table/generic-table.component';
import {GlobalLoadingService} from '../../../core/global-loading.service';
import {
  BackupFrequency,
  BackupJob,
  BackupRestoreResponse,
  BackupSchedule,
  BackupScope,
  BackupSummary,
  BackupsService
} from '../../../services/backups/backups.service';

interface ScopeOption {
  label: string;
  value: BackupScope;
}

interface FrequencyOption {
  label: string;
  value: BackupFrequency;
}

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    Toast,
    GenericTableComponent
  ],
  providers: [MessageService],
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.css']
})
export class BackupsComponent implements OnInit {
  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  summary: BackupSummary | null = null;
  backups: BackupJob[] = [];
  loading = false;
  creatingBackup = false;
  savingSchedule = false;
  restoringBackupId: number | null = null;
  importingBackup = false;

  manualForm: FormGroup;
  scheduleForm: FormGroup;

  scopeOptions: ScopeOption[] = [
    {label: 'Base de datos', value: 'DATABASE'},
    {label: 'Documentos', value: 'DOCUMENTS'},
    {label: 'Completo', value: 'FULL'}
  ];

  frequencyOptions: FrequencyOption[] = [
    {label: 'Diario', value: 'DAILY'},
    {label: 'Semanal', value: 'WEEKLY'},
    {label: 'Mensual', value: 'MONTHLY'}
  ];

  dayOfWeekOptions = [
    {label: 'Lunes', value: 1},
    {label: 'Martes', value: 2},
    {label: 'Miercoles', value: 3},
    {label: 'Jueves', value: 4},
    {label: 'Viernes', value: 5},
    {label: 'Sabado', value: 6},
    {label: 'Domingo', value: 7}
  ];

  columns: GenericColumn<BackupJob>[] = [
    {key: 'createdAt', header: 'Fecha', value: (row) => row.createdAt, format: (value) => this.formatDateTime(value)},
    {key: 'triggerType', header: 'Origen', value: (row) => this.formatTrigger(row.triggerType)},
    {key: 'scope', header: 'Tipo', value: (row) => this.formatScope(row.scope)},
    {key: 'status', header: 'Estado', type: 'tag', tagValue: (row) => this.formatStatus(row.status), tagSeverity: (row) => this.statusSeverity(row.status)},
    {key: 'requestedBy', header: 'Usuario', field: 'requestedBy'},
    {key: 'fileSizeBytes', header: 'Tamano', value: (row) => row.fileSizeBytes, format: (value) => this.formatBytes(value)},
    {key: 'durationMillis', header: 'Duracion', value: (row) => row.durationMillis, format: (value) => this.formatDuration(value)},
    {key: 'comment', header: 'Comentario', field: 'comment', truncate: true},
    {key: 'actions', header: 'Acciones', type: 'actions', align: 'right', width: '120px'}
  ];

  rowActions: RowAction<BackupJob>[] = [
    {
      icon: 'pi pi-download',
      severity: 'info',
      onClick: (row) => this.downloadBackup(row),
      visible: (row) => !!row.id && row.status === 'COMPLETED'
    },
    {
      icon: 'pi pi-refresh',
      severity: 'warn',
      onClick: (row) => this.restoreBackup(row),
      visible: (row) => !!row.id && row.status === 'COMPLETED'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private backupsService: BackupsService,
    private messageService: MessageService,
    private globalLoadingService: GlobalLoadingService
  ) {
    this.manualForm = this.fb.group({
      scope: ['FULL', Validators.required],
      requestedBy: ['admin'],
      comment: ['']
    });

    this.scheduleForm = this.fb.group({
      enabled: [false],
      frequency: ['DAILY', Validators.required],
      executionTime: ['02:00', Validators.required],
      dayOfWeek: [1],
      dayOfMonth: [1],
      retentionCount: [15, [Validators.required, Validators.min(1), Validators.max(180)]],
      scope: ['FULL', Validators.required],
      updatedBy: ['admin']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.globalLoadingService.show('Cargando informacion de backups...');
    forkJoin({
      summary: this.backupsService.getSummary(),
      backups: this.backupsService.getBackups(),
      schedule: this.backupsService.getSchedule()
    }).subscribe({
      next: ({summary, backups, schedule}) => {
        this.summary = summary;
        this.backups = backups;
        this.patchSchedule(schedule);
        this.loading = false;
        this.globalLoadingService.hide();
      },
      error: () => {
        this.loading = false;
        this.globalLoadingService.hide();
        this.showToast('error', 'Error', 'No se pudieron cargar los backups.');
      }
    });
  }

  createBackup(): void {
    if (this.manualForm.invalid || this.creatingBackup) {
      return;
    }

    this.creatingBackup = true;
    this.globalLoadingService.show('Generando backup. Espera a que termine el proceso...');
    this.backupsService.createManualBackup(this.manualForm.getRawValue()).subscribe({
      next: () => {
        this.creatingBackup = false;
        this.globalLoadingService.hide();
        this.showToast('success', 'Backup creado', 'El backup manual se genero correctamente.');
        this.loadData();
      },
      error: () => {
        this.creatingBackup = false;
        this.globalLoadingService.hide();
        this.showToast('error', 'Error', 'No se pudo generar el backup manual.');
      }
    });
  }

  openImportSelector(): void {
    if (this.importingBackup) {
      return;
    }
    this.importFileInput?.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.importingBackup = true;
    this.globalLoadingService.show('Importando backup ZIP al historial...');
    this.backupsService.importBackup(
      file,
      this.manualForm.get('requestedBy')?.value ?? 'admin',
      this.manualForm.get('comment')?.value ?? 'Backup importado'
    ).subscribe({
      next: () => {
        this.importingBackup = false;
        this.globalLoadingService.hide();
        input.value = '';
        this.showToast('success', 'Backup importado', 'El archivo ZIP se agrego al historial correctamente.');
        this.loadData();
      },
      error: () => {
        this.importingBackup = false;
        this.globalLoadingService.hide();
        input.value = '';
        this.showToast('error', 'Error', 'No se pudo importar el archivo ZIP.');
      }
    });
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid || this.savingSchedule) {
      return;
    }

    this.savingSchedule = true;
    this.globalLoadingService.show('Guardando configuracion automatica...');
    this.backupsService.updateSchedule(this.scheduleForm.getRawValue()).subscribe({
      next: (schedule) => {
        this.savingSchedule = false;
        this.globalLoadingService.hide();
        this.summary = this.summary ? {...this.summary, schedule} : this.summary;
        this.patchSchedule(schedule);
        this.showToast('success', 'Programacion actualizada', 'La configuracion automatica fue guardada.');
      },
      error: () => {
        this.savingSchedule = false;
        this.globalLoadingService.hide();
        this.showToast('error', 'Error', 'No se pudo guardar la configuracion automatica.');
      }
    });
  }

  patchSchedule(schedule: BackupSchedule): void {
    this.scheduleForm.patchValue({
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      executionTime: schedule.executionTime?.slice(0, 5) || '02:00',
      dayOfWeek: schedule.dayOfWeek ?? 1,
      dayOfMonth: schedule.dayOfMonth ?? 1,
      retentionCount: schedule.retentionCount ?? 15,
      scope: schedule.scope,
      updatedBy: schedule.updatedBy || 'admin'
    }, {emitEvent: false});
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'dd/MM/yyyy HH:mm', 'es-AR');
  }

  formatScope(scope?: BackupScope): string {
    if (scope === 'DATABASE') return 'Base de datos';
    if (scope === 'DOCUMENTS') return 'Documentos';
    return 'Completo';
  }

  formatTrigger(trigger?: string): string {
    return trigger === 'AUTOMATIC' ? 'Automatico' : 'Manual';
  }

  formatStatus(status?: string): string {
    if (status === 'COMPLETED') return 'Completado';
    if (status === 'FAILED') return 'Fallido';
    return 'En ejecucion';
  }

  statusSeverity(status?: string): 'success' | 'danger' | 'warn' {
    if (status === 'COMPLETED') return 'success';
    if (status === 'FAILED') return 'danger';
    return 'warn';
  }

  formatBytes(value?: number | null): string {
    const size = Number(value ?? 0);
    if (!size) return '-';
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${size} B`;
  }

  formatDuration(value?: number | null): string {
    const ms = Number(value ?? 0);
    if (!ms) return '-';
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  }

  downloadBackup(row: BackupJob): void {
    if (!row.id) return;
    window.open(this.backupsService.getDownloadUrl(row.id), '_blank');
  }

  restoreBackup(row: BackupJob): void {
    if (!row.id || this.restoringBackupId !== null) return;
    this.restoringBackupId = row.id;
    this.globalLoadingService.show('Restaurando backup. La aplicacion permanecera bloqueada hasta finalizar...');
    this.backupsService.restoreBackup(row.id).subscribe({
      next: (response: BackupRestoreResponse) => {
        this.restoringBackupId = null;
        this.globalLoadingService.hide();
        this.showToast(
          'success',
          'Backup restaurado',
          `Tablas: ${response.tablesRestored}. Documentos: ${response.documentFilesRestored}.`
        );
        this.loadData();
      },
      error: () => {
        this.restoringBackupId = null;
        this.globalLoadingService.hide();
        this.showToast('error', 'Error', 'No se pudo restaurar el backup seleccionado.');
      }
    });
  }

  private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({severity, summary, detail});
  }
}
