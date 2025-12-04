import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {forkJoin} from 'rxjs';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {Router} from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiErrorService } from '../../../core/api-error.service';

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
  ],
  templateUrl: './proveedores-list.component.html'
})
export class ProveedoresListComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  tiposRecords: { label: string; name: string }[] = [];
  tipoOptions: TipoOption[] = [];

  searchValue: string = '';
  tipoFiltro: number | 'todos' = 'todos';

  loading = true;

  @Output() proveedorClick = new EventEmitter<Proveedor>();

  constructor(
    private service: ProveedoresService,
    private router: Router,
    private messageService: MessageService,
    private apiErrorService: ApiErrorService
  ) {
  }

  ngOnInit() {
    forkJoin({ proveedores: this.service.getProveedores(), tipos: this.service.getTipos() }).subscribe({
      next: ({proveedores, tipos}) => {
        this.proveedores = proveedores;
        this.proveedoresFiltrados = [...this.proveedores];
        this.tiposRecords = tipos;
        this.tipoOptions = [ {label: 'Todos', name: 'TODOS'}, ...this.tiposRecords.map(r => ({label: r.label, name: r.name})) ];
        this.loading = false;
        console.log(this.proveedores);
      },
      error: err => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.apiErrorService.getMessage(
            err,
            'No se pudieron cargar los proveedores.'
          )
        });
      }
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
        (proveedor.tipo_proveedor?.toLowerCase().includes(search) ?? false)
        : true;

      const matchesTipo =
        this.tipoFiltro === 'todos'
          ? true
          : ((proveedor as any).tipo_proveedor_value || '') === this.tipoFiltro;

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

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }


}

