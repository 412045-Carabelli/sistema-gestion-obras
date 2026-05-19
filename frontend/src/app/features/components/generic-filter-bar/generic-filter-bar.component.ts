import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { Subscription } from 'rxjs';

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'input' | 'date' | 'checkbox';
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
    CheckboxModule
  ],
  templateUrl: './generic-filter-bar.component.html',
  styleUrls: ['./generic-filter-bar.component.css']
})
export class GenericFilterBarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filterDefinitions: FilterDefinition[] = [];
  @Input() actions: FilterAction[] = [];
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
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private initForm(): void {
    const formConfig: Record<string, any> = {};

    this.filterDefinitions.forEach((filter) => {
      const validators = filter.validators || [];
      // Checkboxes initialize to false, others to null
      const defaultValue = filter.type === 'checkbox' ? false : null;
      formConfig[filter.key] = [defaultValue, validators];
    });

    this.form = this.fb.group(formConfig);

    // Emit filter changes
    this.subs.add(
      this.form.valueChanges.subscribe((values) => {
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
      })
    );
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
