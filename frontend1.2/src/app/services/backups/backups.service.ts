import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export type BackupScope = 'DATABASE' | 'DOCUMENTS' | 'FULL';
export type BackupStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
export type BackupTriggerType = 'MANUAL' | 'AUTOMATIC';
export type BackupFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BackupJob {
  id: number;
  triggerType: BackupTriggerType;
  scope: BackupScope;
  status: BackupStatus;
  requestedBy?: string;
  comment?: string;
  fileName?: string;
  filePath?: string;
  fileSizeBytes?: number;
  durationMillis?: number;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: BackupFrequency;
  executionTime: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  retentionCount: number;
  scope: BackupScope;
  nextRunAt?: string | null;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BackupSummary {
  lastSuccessfulBackup?: BackupJob | null;
  schedule: BackupSchedule;
  totalBackups: number;
  totalStorageBytes: number;
}

export interface BackupRestoreResponse {
  backupId: number;
  backupFileName: string;
  tablesRestored: number;
  documentFilesRestored: number;
  message: string;
}

export interface CreateBackupRequest {
  scope: BackupScope;
  comment?: string;
  requestedBy?: string;
}

export interface UpdateBackupScheduleRequest {
  enabled: boolean;
  frequency: BackupFrequency;
  executionTime: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  retentionCount: number;
  scope: BackupScope;
  updatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackupsService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.backups}`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<BackupSummary> {
    return this.http.get<BackupSummary>(`${this.apiUrl}/summary`);
  }

  getBackups(): Observable<BackupJob[]> {
    return this.http.get<BackupJob[]>(this.apiUrl);
  }

  getSchedule(): Observable<BackupSchedule> {
    return this.http.get<BackupSchedule>(`${this.apiUrl}/schedule`);
  }

  createManualBackup(payload: CreateBackupRequest): Observable<BackupJob> {
    return this.http.post<BackupJob>(`${this.apiUrl}/manual`, payload);
  }

  importBackup(file: File, requestedBy?: string, comment?: string): Observable<BackupJob> {
    const formData = new FormData();
    formData.append('file', file);
    if (requestedBy?.trim()) {
      formData.append('requestedBy', requestedBy.trim());
    }
    if (comment?.trim()) {
      formData.append('comment', comment.trim());
    }
    return this.http.post<BackupJob>(`${this.apiUrl}/import`, formData);
  }

  updateSchedule(payload: UpdateBackupScheduleRequest): Observable<BackupSchedule> {
    return this.http.put<BackupSchedule>(`${this.apiUrl}/schedule`, payload);
  }

  restoreBackup(id: number): Observable<BackupRestoreResponse> {
    return this.http.post<BackupRestoreResponse>(`${this.apiUrl}/${id}/restore`, {});
  }

  getDownloadUrl(id: number): string {
    return `${this.apiUrl}/${id}/download`;
  }
}
