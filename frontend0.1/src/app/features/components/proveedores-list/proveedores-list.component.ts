import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { forkJoin } from 'rxjs';
import { Proveedor, TipoProveedor } from '../../../core/models/models';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import {Tag} from 'primeng/tag';
import {Router} from '@angular/router';

interface TipoOption {
  label: string;
  value: number | 'todos';
}

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
  ],
  templateUrl: './proveedores-list.component.html'
})
export class ProveedoresListComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  tipos: TipoProveedor[] = [];
  tipoOptions: TipoOption[] = [];

  searchValue: string = '';
  tipoFiltro: number | 'todos' = 'todos';

  loading = true;

  @Output() proveedorClick = new EventEmitter<Proveedor>();

  constructor(private service: ProveedoresService, private router: Router) {}

  ngOnInit() {
    forkJoin({
      proveedores: this.service.getProveedores(),
      tipos: this.service.getTipos()
    }).subscribe({
      next: ({ proveedores, tipos }) => {
        this.proveedores = proveedores.map(p => ({ ...p, id: Number(p.id) }));
        this.proveedoresFiltrados = [...this.proveedores];
        console.log(proveedores);
        this.tipos = tipos;
        this.tipoOptions = [
          { label: 'Todos', value: 'todos' },
          ...tipos.map(t => ({ label: t.nombre, value: t.id }))
        ];

        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  applyFilter() {
    this.proveedoresFiltrados = this.proveedores.filter(proveedor => {
      const search = this.searchValue.toLowerCase();

      const matchesSearch = this.searchValue
        ? proveedor.nombre.toLowerCase().includes(search) ||
        (proveedor.contacto?.toLowerCase().includes(search) ?? false) ||
        (proveedor.telefono?.toLowerCase().includes(search) ?? false) ||
        (proveedor.email?.toLowerCase().includes(search) ?? false) ||
        (proveedor.tipo_proveedor?.nombre?.toLowerCase().includes(search) ?? false)
        : true;

      const matchesTipo =
        this.tipoFiltro === 'todos'
          ? true
          : proveedor.tipo_proveedor?.id === this.tipoFiltro;

      return matchesSearch && matchesTipo;
    });
  }

  irAlDetalle(proveedor: any) {
    this.proveedorClick.emit(proveedor);
    this.router.navigate(['/proveedores', proveedor.id]);
  }

  onTipoChange() {
    this.applyFilter();
  }

}
