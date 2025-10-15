import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { DropdownModule } from 'primeng/dropdown';
import { Tooltip } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Checkbox } from 'primeng/checkbox';

import { Cliente, Obra, ObraCosto, EstadoObra } from '../../../core/models/models';
import { ObraCostosTableComponent } from '../../components/obra-costos-table/obra-costos-table.component';
import { ObraPayload, ObrasService } from '../../../services/obras/obras.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { EstadoObraService } from '../../../services/estado-obra/estado-obra.service';

@Component({
  selector: 'app-obras-edit',
  standalone: true,
  templateUrl: './obras-edit.component.html',
  styleUrls: ['./obras-edit.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TabsModule,
    ObraCostosTableComponent,
    DropdownModule,
    Tooltip,
    ProgressSpinnerModule,
    ToastModule,
    Checkbox,
  ],
  providers: [MessageService],
})
export class ObrasEditComponent implements OnInit {
  @Input() obra!: Obra;

  clientes: Cliente[] = [];
  estadosObra: EstadoObra[] = [];
  form!: FormGroup;
  loading = true;
  private obraId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private obrasService: ObrasService,
    private clienteService: ClientesService,
    private estadoObraService: EstadoObraService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.obraId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.obraId) this.cargarDatosIniciales(this.obraId);
  }

  get costos(): FormArray<FormGroup> {
    return this.form.get('costos') as FormArray<FormGroup>;
  }

  private cargarDatosIniciales(idObra: number) {
    this.loading = true;
    forkJoin({
      clientes: this.clienteService.getClientes(),
      estados: this.estadoObraService.getEstados(),
      obra: this.obrasService.getObraById(idObra),
    }).subscribe({
      next: ({ clientes, estados, obra }) => {
        this.clientes = clientes;
        this.estadosObra = estados;
        this.obra = { ...obra, costos: obra.costos ?? [] } as Obra;
        this.inicializarFormulario();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar datos',
          detail: 'No se pudieron cargar los datos de la obra.',
          life: 3000,
        });
      },
    });
  }

  private inicializarFormulario() {
    this.form = this.fb.group({
      cliente: [this.obra.cliente, Validators.required],
      obra_estado: [this.obra.obra_estado, Validators.required],
      nombre: [this.obra.nombre, [Validators.required, Validators.minLength(3)]],
      direccion: [this.obra.direccion, [Validators.required, Validators.minLength(5)]],
      fecha_inicio: [this.parseDate(this.obra.fecha_inicio), Validators.required],
      beneficio_global: [this.obra.beneficio_global],
      beneficio: [this.obra.beneficio, [Validators.required]],
      fecha_fin: [this.parseDate(this.obra.fecha_fin)],
      fecha_adjudicada: [this.parseDate(this.obra.fecha_adjudicada)],
      fecha_perdida: [this.parseDate(this.obra.fecha_perdida)],
      presupuesto: [{ value: this.obra.presupuesto, disabled: true }, Validators.required],
      tiene_comision: [this.obra.tiene_comision ?? false],
      comision: [this.obra.comision ?? 0, [Validators.min(0), Validators.max(100)]],
      costos: this.fb.array<FormGroup>([])
    });

    this.cargarCostosEnFormArray(this.obra.costos ?? []);
  }

  private cargarCostosEnFormArray(costos: ObraCosto[]) {
    const costosArray = this.form.get('costos') as FormArray<FormGroup>;
    costosArray.clear();
    costos.forEach((costo) => {
      costosArray.push(
        this.fb.group({
          id: [costo.id],
          id_obra: [costo.id_obra],
          descripcion: [costo.descripcion, Validators.required],
          unidad: [costo.unidad],
          cantidad: [costo.cantidad, [Validators.required, Validators.min(0)]],
          precio_unitario: [costo.precio_unitario, [Validators.required, Validators.min(0)]],
          beneficio: [costo.beneficio ?? 0],
          proveedor: [costo.proveedor ?? null, Validators.required],
          id_estado_pago: [costo.id_estado_pago ?? null],
          activo: [costo.activo ?? true],
          total: [{ value: costo.total ?? (costo.cantidad * costo.precio_unitario) ?? 0, disabled: true }],
        })
      );
    });
  }

  parseDate(value?: string): Date | null {
    return value ? new Date(value) : null;
  }

  formatDate(date: Date | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString().slice(0, 19);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: ObraPayload = {
      id: this.obraId!,
      id_cliente: raw.cliente.id,
      obra_estado: raw.obra_estado,
      nombre: raw.nombre,
      direccion: raw.direccion,
      fecha_inicio: this.formatDate(this.form.value.fecha_inicio)!,
      fecha_fin: this.formatDate(this.form.value.fecha_fin),
      fecha_adjudicada: this.formatDate(this.form.value.fecha_adjudicada),
      fecha_perdida: this.formatDate(this.form.value.fecha_perdida),
      presupuesto: raw.presupuesto,
      comision: raw.comision,
      beneficio: raw.beneficio,
      beneficio_global: raw.beneficio_global,
      tareas: [],
      // 🧭 transformación de costos para backend
      costos: raw.costos.map((c: any) => ({
        ...c,
        id_proveedor: c.proveedor?.id ?? null,
        proveedor: undefined // eliminamos el objeto proveedor para no romper el contrato
      }))
    };

    // 🧼 limpiar undefined
    Object.keys(payload).forEach(
      key => (payload as any)[key] === undefined && delete (payload as any)[key]
    );

    console.log('Payload limpio:', payload);
    this.loading = true;

    this.obrasService.updateObra(this.obra.id!, payload).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Obra actualizada',
          detail: 'Los cambios se guardaron correctamente.',
          life: 3000,
        });
        setTimeout(() => this.router.navigate(['/obras']), 1200);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: 'No se pudo actualizar la obra.',
          life: 3000,
        });
      },
    });
  }
}
