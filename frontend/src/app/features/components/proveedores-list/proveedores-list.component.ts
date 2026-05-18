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
import {forkJoin} from 'rxjs';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {Router} from '@angular/router';

interface TipoOption { label: string; name: string | 'todos'; }
interface SaldoOption { label: string; value: 'todos' | 'con_saldo' | 'saldo_cero_o_menor'; }

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
  saldoOptions: SaldoOption[] = [
    {label: 'Todos', value: 'todos'},
    {label: 'Con saldo', value: 'con_saldo'},
    {label: 'Saldo = 0 o < 0', value: 'saldo_cero_o_menor'}
  ];
  saldosProveedor: Record<number, number> = {};
  totalesProveedor: Record<number, number> = {};
  ultimoMovimientoProveedor: Record<number, number> = {};

  searchValue: string = '';
  tipoFiltro: number | 'todos' = 'todos';
  saldoFiltro: 'todos' | 'con_saldo' | 'saldo_cero_o_menor' = 'todos';
  mostrarInactivos = false;

  datosCargados = false;

  @Output() proveedorClick = new EventEmitter<Proveedor>();

  constructor(
    private service: ProveedoresService,
    private router: Router
  ) {
  }

  ngOnInit() {
    forkJoin({
      proveedores: this.service.getProveedoresAll(),
      tipos: this.service.getTipos()
    }).subscribe({
      next: ({proveedores, tipos}) => {
        this.proveedores = proveedores;
        this.tiposRecords = tipos;
        this.tipoOptions = [ {label: 'Todos', name: 'todos'}, ...this.tiposRecords.map(r => ({label: r.label, name: r.name})) ];
        this.applyFilter();
        this.datosCargados = true;
      },
      error: () => (this.datosCargados = true)
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

      const saldo = this.obtenerSaldoProveedor(proveedor.id);
      const matchesSaldo =
        this.saldoFiltro === 'todos'
          ? true
          : this.saldoFiltro === 'con_saldo'
            ? saldo > 0.01
            : saldo <= 0.01;

      return matchesSearch && matchesTipo && matchesActivo && matchesSaldo;
    })
      .map(proveedor => ({
        ...proveedor,
        totalProveedor: this.obtenerTotalProveedor(proveedor.id),
        saldoProveedor: this.obtenerSaldoProveedor(proveedor.id)
      }))
      .sort((a, b) => {
        const movA = this.ultimoMovimientoProveedor[a.id] ?? Number.NEGATIVE_INFINITY;
        const movB = this.ultimoMovimientoProveedor[b.id] ?? Number.NEGATIVE_INFINITY;
        if (movA !== movB) return movB - movA;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      });
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

  onSaldoChange() {
    this.applyFilter();
  }

  obtenerSaldoProveedor(id?: number): number {
    if (!id) return 0;
    return this.saldosProveedor[id] ?? 0;
  }

  obtenerTotalProveedor(id?: number): number {
    if (!id) return 0;
    return this.totalesProveedor[id] ?? 0;
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }


}


