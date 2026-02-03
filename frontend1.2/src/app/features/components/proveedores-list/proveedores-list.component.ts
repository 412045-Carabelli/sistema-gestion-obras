import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {catchError, forkJoin, map, of} from 'rxjs';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {Router} from '@angular/router';
import {ReportesService} from '../../../services/reportes/reportes.service';

interface TipoOption { label: string; name: string | 'todos'; }

@Component({
  selector: 'app-proveedores-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    IconField,
    InputIcon,
    InputText,
    Select,
    ButtonModule,
    CheckboxModule,
  ],
  templateUrl: './proveedores-list.component.html'
})
export class ProveedoresListComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  tiposRecords: { label: string; name: string }[] = [];
  tipoOptions: TipoOption[] = [];
  saldosProveedor: Record<number, number> = {};

  searchValue: string = '';
  tipoFiltro: number | 'todos' = 'todos';
  mostrarInactivos = false;

  loading = true;

  @Output() proveedorClick = new EventEmitter<Proveedor>();

  constructor(
    private service: ProveedoresService,
    private reportesService: ReportesService,
    private router: Router
  ) {
  }

  ngOnInit() {
    forkJoin({ proveedores: this.service.getProveedoresAll(), tipos: this.service.getTipos() }).subscribe({
      next: ({proveedores, tipos}) => {
        this.proveedores = proveedores;
        this.tiposRecords = tipos;
        this.tipoOptions = [ {label: 'Todos', name: 'todos'}, ...this.tiposRecords.map(r => ({label: r.label, name: r.name})) ];
        this.applyFilter();
        this.cargarSaldosProveedores();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }


  applyFilter() {
    this.proveedoresFiltrados = this.proveedores
      .filter(proveedor => {
      const search = this.searchValue.toLowerCase();

      const matchesSearch = this.searchValue
        ? proveedor.nombre.toLowerCase().includes(search) ||
        (proveedor.contacto?.toLowerCase().includes(search) ?? false) ||
        (proveedor.telefono?.toLowerCase().includes(search) ?? false) ||
        (proveedor.email?.toLowerCase().includes(search) ?? false) ||
        (proveedor.tipo_proveedor?.toLowerCase().includes(search) ?? false)
        : true;

      const matchesTipo =
        this.tipoFiltro === 'todos'
          ? true
          : ((proveedor as any).tipo_proveedor_value || '') === this.tipoFiltro;

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(proveedor.activo ?? true);

      return matchesSearch && matchesTipo && matchesActivo;
    })
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  }

  irAlDetalle(proveedor: any) {
    this.proveedorClick.emit(proveedor);
    this.router.navigate(['/proveedores', proveedor.id]);
  }

  onTipoChange() {
    this.applyFilter();
  }

  onMostrarInactivosChange() {
    this.applyFilter();
  }

  private cargarSaldosProveedores() {
    if (!this.proveedores.length) {
      this.saldosProveedor = {};
      return;
    }

    this.reportesService.getCuentaCorrienteProveedores().pipe(
      map((results) => (results || []).map(item => {
        const id = Number((item as any)?.proveedorId ?? (item as any)?.id ?? 0);
        const saldo = (item as any)?.saldoFinal ?? (item as any)?.saldo ?? 0;
        return {id, saldo};
      })),
      catchError(() => of([]))
    ).subscribe(results => {
      this.saldosProveedor = results.reduce((acc, item) => {
        if (item.id) {
          acc[item.id] = item.saldo;
        }
        return acc;
      }, {} as Record<number, number>);
    });
  }

  obtenerSaldoProveedor(id?: number): number {
    if (!id) return 0;
    return this.saldosProveedor[id] ?? 0;
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }


}


