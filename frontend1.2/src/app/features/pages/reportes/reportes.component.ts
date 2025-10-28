import {Component, OnInit} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {
  AvanceTareasResponse,
  Cliente,
  CostosPorCategoriaResponse,
  EstadoFinancieroObraResponse,
  EstadoObra,
  EstadoObrasFilter,
  EstadoObrasResponse,
  FlujoCajaResponse,
  IngresosEgresosResponse,
  NotasObraResponse,
  Obra,
  PendientesResponse,
  Proveedor,
  RankingClientesResponse,
  RankingProveedoresResponse,
  ReportFilter,
  ResumenGeneralResponse
} from '../../../core/models/models';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {DropdownModule} from 'primeng/dropdown';
import {MultiSelectModule} from 'primeng/multiselect';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {DividerModule} from 'primeng/divider';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {

  filtrosForm!: FormGroup;

  obrasOptions: SelectOption<number>[] = [];
  clientesOptions: SelectOption<number>[] = [];
  proveedoresOptions: SelectOption<number>[] = [];
  estadosObraOptions: SelectOption<number>[] = [];

  resumenGeneral: ResumenGeneralResponse | null = null;
  ingresosEgresos: IngresosEgresosResponse | null = null;
  flujoCaja: FlujoCajaResponse | null = null;
  pendientes: PendientesResponse | null = null;
  estadoObras: EstadoObrasResponse | null = null;
  avanceTareas: AvanceTareasResponse | null = null;
  costosPorCategoria: CostosPorCategoriaResponse | null = null;
  rankingClientes: RankingClientesResponse | null = null;
  rankingProveedores: RankingProveedoresResponse | null = null;
  notasGenerales: NotasObraResponse[] = [];
  notaObraSeleccionada: NotasObraResponse | null = null;
  estadoFinancieroObra: EstadoFinancieroObraResponse | null = null;

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogos();
    this.loadReportes();
  }

  initForm(): void {
    this.filtrosForm = this.fb.group({
      obraId: [null],
      clienteId: [null],
      proveedorId: [null],
      estadosObra: [[]],
      rangoFechas: [null]
    });
  }

  loadCatalogos(): void {
    this.obrasService.getObras().subscribe({
      next: (obras: Obra[]) => {
        this.obrasOptions = obras.map((obra) => ({label: obra.nombre, value: obra.id!}));
      },
      error: (error) => console.error('No se pudieron cargar las obras', error)
    });

    this.clientesService.getClientes().subscribe({
      next: (clientes: Cliente[]) => {
        this.clientesOptions = clientes.map((cliente) => ({label: cliente.nombre, value: cliente.id}));
      },
      error: (error) => console.error('No se pudieron cargar los clientes', error)
    });

    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores: Proveedor[]) => {
        this.proveedoresOptions = proveedores.map((proveedor) => ({label: proveedor.nombre, value: proveedor.id}));
      },
      error: (error) => console.error('No se pudieron cargar los proveedores', error)
    });

    this.estadoObraService.getEstados().subscribe({
      next: (estados: EstadoObra[]) => {
        this.estadosObraOptions = estados.map((estado) => ({label: estado.nombre, value: estado.id}));
      },
      error: (error) => console.error('No se pudieron cargar los estados de obra', error)
    });
  }

  applyFilters(): void {
    this.loadReportes();
  }

  clearFilters(): void {
    this.filtrosForm.reset({
      obraId: null,
      clienteId: null,
      proveedorId: null,
      estadosObra: [],
      rangoFechas: null
    });
    this.loadReportes();
  }

  private loadReportes(): void {
    this.loading = true;
    this.errorMessage = null;

    const filtrosReporte = this.buildReportFilter();
    const filtrosEstadoObra = this.buildEstadoObraFilter();

    forkJoin({
      resumen: this.withDefault(this.reportesService.getResumenGeneral(), {
        totalObras: 0,
        totalClientes: 0,
        totalProveedores: 0,
        totalIngresos: 0,
        totalEgresos: 0
      }),
      ingresosEgresos: this.withDefault(this.reportesService.getIngresosEgresos(filtrosReporte), {
        totalIngresos: 0,
        totalEgresos: 0,
        detallePorObra: []
      }),
      flujoCaja: this.withDefault(this.reportesService.getFlujoCaja(filtrosReporte), {
        totalIngresos: 0,
        totalEgresos: 0,
        saldoFinal: 0,
        movimientos: []
      }),
      pendientes: this.withDefault(this.reportesService.getPendientes(filtrosReporte), {pendientes: []}),
      estadoObras: this.withDefault(this.reportesService.getEstadoObras(filtrosEstadoObra), {obras: []}),
      avanceTareas: this.withDefault(this.reportesService.getAvanceTareas(filtrosReporte), {avances: []}),
      costosCategoria: this.withDefault(this.reportesService.getCostosPorCategoria(filtrosReporte), {total: 0, categorias: []}),
      rankingClientes: this.withDefault(this.reportesService.getRankingClientes(filtrosReporte), {clientes: []}),
      rankingProveedores: this.withDefault(this.reportesService.getRankingProveedores(filtrosReporte), {proveedores: []}),
      notasGenerales: this.withDefault(this.reportesService.getNotasGenerales(), [])
    }).subscribe({
      next: (data) => {
        this.resumenGeneral = data.resumen;
        this.ingresosEgresos = data.ingresosEgresos;
        this.flujoCaja = data.flujoCaja;
        this.pendientes = data.pendientes;
        this.estadoObras = data.estadoObras;
        this.avanceTareas = data.avanceTareas;
        this.costosPorCategoria = data.costosCategoria;
        this.rankingClientes = data.rankingClientes;
        this.rankingProveedores = data.rankingProveedores;
        this.notasGenerales = data.notasGenerales;

        const obraId = filtrosReporte?.obraId ?? null;
        if (obraId) {
          this.loadEstadoFinanciero(obraId);
          this.loadNotasObra(obraId);
        } else {
          this.estadoFinancieroObra = null;
          this.notaObraSeleccionada = null;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar los reportes', error);
        this.errorMessage = 'No se pudieron cargar los reportes. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  private loadEstadoFinanciero(obraId: number): void {
    this.reportesService.getEstadoFinanciero(obraId).pipe(
      catchError((error) => {
        console.error('Error al cargar el estado financiero', error);
        this.errorMessage = this.errorMessage ?? 'Algunos reportes no pudieron cargarse.';
        return of(null);
      })
    ).subscribe((data) => {
      this.estadoFinancieroObra = data;
    });
  }

  private loadNotasObra(obraId: number): void {
    this.reportesService.getNotasPorObra(obraId).pipe(
      catchError((error) => {
        console.error('Error al cargar las notas de la obra', error);
        this.errorMessage = this.errorMessage ?? 'Algunos reportes no pudieron cargarse.';
        return of(null);
      })
    ).subscribe((data) => {
      this.notaObraSeleccionada = data;
    });
  }

  private buildReportFilter(): ReportFilter | undefined {
    const {obraId, clienteId, proveedorId, rangoFechas} = this.filtrosForm.value;

    const filtro: ReportFilter = {};

    if (obraId) {
      filtro.obraId = obraId;
    }
    if (clienteId) {
      filtro.clienteId = clienteId;
    }
    if (proveedorId) {
      filtro.proveedorId = proveedorId;
    }
    if (rangoFechas && Array.isArray(rangoFechas)) {
      const [inicio, fin] = rangoFechas;
      if (inicio) {
        filtro.fechaInicio = this.formatDateValue(inicio);
      }
      if (fin) {
        filtro.fechaFin = this.formatDateValue(fin);
      }
    }

    return Object.keys(filtro).length > 0 ? filtro : undefined;
  }

  private buildEstadoObraFilter(): EstadoObrasFilter | undefined {
    const {estadosObra, clienteId, rangoFechas} = this.filtrosForm.value;
    const filtro: EstadoObrasFilter = {};

    if (estadosObra && estadosObra.length > 0) {
      filtro.estados = estadosObra;
    }
    if (clienteId) {
      filtro.clienteId = clienteId;
    }
    if (rangoFechas && Array.isArray(rangoFechas)) {
      const [inicio, fin] = rangoFechas;
      if (inicio) {
        filtro.fechaInicio = this.formatDateValue(inicio);
      }
      if (fin) {
        filtro.fechaFin = this.formatDateValue(fin);
      }
    }

    return Object.keys(filtro).length > 0 ? filtro : undefined;
  }

  private formatDateValue(value: Date): string {
    return formatDate(value, 'yyyy-MM-dd', 'es-AR');
  }

  private withDefault<T>(observable: Observable<T>, defaultValue: T): Observable<T> {
    return observable.pipe(
      catchError((error) => {
        console.error('Error recuperando un reporte', error);
        this.errorMessage = this.errorMessage ?? 'Algunos reportes no pudieron cargarse por completo.';
        return of(defaultValue);
      })
    );
  }
}
