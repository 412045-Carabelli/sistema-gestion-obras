import {Component, Input, TemplateRef, HostBinding} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';

export type ColumnAlign = 'left' | 'right' | 'center';
export type ColumnType = 'text' | 'date' | 'currency' | 'tag' | 'custom' | 'actions';

export interface GenericColumn<T> {
  key: string;
  header: string;
  field?: keyof T | string;
  align?: ColumnAlign;
  width?: string;
  type?: ColumnType;
  truncate?: boolean;
  value?: (row: T) => any;
  format?: (value: any, row: T) => string;
  tagSeverity?: (row: T) => string | undefined;
  tagValue?: (row: T) => string | undefined;
}

export interface RowAction<T> {
  icon: string;
  label?: string;
  onClick: (row: T) => void;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger';
  text?: boolean;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule],
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.css']
})
export class GenericTableComponent<T> {
  @Input() value: T[] = [];
  @Input() columns: GenericColumn<T>[] = [];
  @Input() rowActions: RowAction<T>[] = [];
  @Input() customTemplates: Record<string, TemplateRef<any>> = {};
  @Input() bodyTemplate?: TemplateRef<any>;

  @Input() paginator = true;
  @Input() rows = 8;
  @Input() rowsPerPageOptions: number[] = [8, 16, 32];
  @Input() rowHover = true;
  @Input() tableClass = 'p-datatable-sm';

  @Input() emptyTitle = 'No hay registros para mostrar';
  @Input() emptySubtitle = 'Ajusta los filtros o crea un nuevo registro.';
  @Input() emptyIcon = 'pi pi-inbox';
  @Input() emptyMinHeight = 'calc(100vh - 320px)';
  @Input() rowClick?: (row: T) => void;
  @Input() rowClass?: (row: T) => string;

  @HostBinding('style.--empty-min-height')
  get emptyMinHeightCss(): string {
    return this.emptyMinHeight;
  }

  resolveValue(column: GenericColumn<T>, row: T): any {
    if (column.value) {
      return column.value(row);
    }
    const field = column.field ?? column.key;
    return this.getFieldValue(row, String(field));
  }

  formatValue(column: GenericColumn<T>, row: T): string {
    const value = this.resolveValue(column, row);
    if (column.format) {
      return column.format(value, row);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  shouldShowAction(action: RowAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  getActionDisabled(action: RowAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  handleRowClick(row: T): void {
    if (this.rowClick) {
      this.rowClick(row);
    }
  }

  onActionClick(event: Event, action: RowAction<T>, row: T): void {
    event.stopPropagation();
    action.onClick(row);
  }

  private getFieldValue(row: any, fieldPath: string): any {
    if (!row || !fieldPath) return null;
    return fieldPath.split('.').reduce((acc, key) => (acc ? acc[key] : null), row);
  }
}
