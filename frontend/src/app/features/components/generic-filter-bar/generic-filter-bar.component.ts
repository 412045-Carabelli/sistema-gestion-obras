import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'input' | 'date' | 'checkbox' | 'multiselect';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validators?: any[];
}

export interface FilterAction {
  label: string;
  icon: string;
  severity?: 'primary' | 'success' | 'danger' | 'info' | 'secondary';
  loading?: boolean;
  callback: () => void;
}

export interface ViewToggleOption {
  label: string;
  icon: string;
  callback: () => void;
  isActive?: () => boolean;
}

@Component({
  selector: 'app-generic-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    CheckboxModule,
    MultiSelectModule
  ],
  templateUrl: './generic-filter-bar.component.html',
  styleUrls: ['./generic-filter-bar.component.css']
})
export class GenericFilterBarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filterDefinitions: FilterDefinition[] = [];
  @Input() actions: FilterAction[] = [];
  @Input() viewToggle?: { options: ViewToggleOption[] };
  @Input() initialValues: Record<string, any> | null = null;
  @Output() filterChange = new EventEmitter<Record<string, any>>();
  @Output() clearFilters = new EventEmitter<void>();

  form!: FormGroup;
  private subs = new Subscription();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterDefinitions'] && !changes['filterDefinitions'].firstChange) {
      this.initForm();
      return;
    }
    if (changes['initialValues'] && !changes['initialValues'].firstChange && this.form) {
      this.form.patchValue(this.initialValues || {}, {emitEvent: false});
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private initForm(): void {
    const formConfig: Record<string, any> = {};

    this.filterDefinitions.forEach((filter) => {
      const validators = filter.validators || [];
      // Checkboxes initialize to false, multiselect to [], others to null
      const defaultValue = filter.type === 'checkbox' ? false : filter.type === 'multiselect' ? [] : null;
      formConfig[filter.key] = [defaultValue, validators];
    });

    this.form = this.fb.group(formConfig);

    if (this.initialValues) {
      this.form.patchValue(this.initialValues, {emitEvent: false});
    }

    // Emit filter changes: los campos de texto libre ('input') se debouncean 500ms
    // para no disparar una búsqueda por cada tecla; el resto emite al toque.
    const emitCurrentValues = () => {
      const values = this.form.value;
      const filteredValues = Object.entries(values)
        .filter(([, value]) => {
          // Include checkboxes that are true, exclude null/empty strings
          if (value === true) return true;
          if (value === false) return false;
          return value !== null && value !== '';
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);

      this.filterChange.emit(filteredValues);
    };

    const streams = this.filterDefinitions
      .map((f) => {
        const control = this.form.get(f.key);
        if (!control) return null;
        // debounceTime(0) en los no-texto no es "delay" perceptible: empuja la lectura de
        // this.form.value a después de que el FormGroup padre termine de recalcular su valor
        // agregado (Angular dispara el valueChanges del control HIJO antes de eso, así que
        // leerlo en el mismo tick devuelve el valor viejo del padre).
        return control.valueChanges.pipe(debounceTime(f.type === 'input' ? 500 : 0));
      })
      .filter((s): s is NonNullable<typeof s> => !!s);

    if (streams.length) {
      this.subs.add(merge(...streams).subscribe(() => emitCurrentValues()));
    }
  }

  getFilterOptions(key: string): Array<{ label: string; value: any }> {
    const filterDef = this.filterDefinitions.find((f) => f.key === key);
    return filterDef?.options || [];
  }

  onLimpiar(): void {
    this.form.reset();
    this.clearFilters.emit();
  }

  executeAction(action: FilterAction): void {
    action.callback();
  }
}
