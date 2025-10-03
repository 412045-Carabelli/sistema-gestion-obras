import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Obra } from '../../../core/models/models';

interface EstadoOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-obra-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './obra-list.component.html',
  styleUrls: ['./obra-list.component.css']
})
export class ObraListComponent implements OnInit {
  @Output() obraClick = new EventEmitter<Obra>();

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  estadoFiltro: string = 'todos';
  searchValue: string = '';

  estadosOptions: EstadoOption[] = [];

  // Mocks de clientes y estados
  clientesMap: { [id: number]: string } = {
    1: 'Constructora Norte',
    2: 'Municipalidad de Córdoba',
    3: 'Desarrollos del Sur',
    4: 'Ministerio de Educación',
    5: 'Inversiones Rivera SA',
    6: 'Metales Córdoba SA',
    7: 'Arboleda Desarrollos',
    8: 'Gobierno de Córdoba'
  };

  estadosMap: { [id: number]: string } = {
    1: 'Presupuestada',
    2: 'Cotizada',
    3: 'Adjudicada',
    4: 'Iniciada',
    5: 'En Progreso',
    6: 'Finalizada',
    7: 'Perdida'
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Cargar opciones de estado
    this.estadosOptions = [
      { label: 'Todos', value: 'todos' },
      ...Object.entries(this.estadosMap).map(([id, label]) => ({
        label,
        value: label.toLowerCase()
      }))
    ];

    // Mock de datos
    this.obras = [
      {
        id_obra: 1,
        id_cliente: 1,
        id_estado_obra: 1,
        nombre: 'Edificio San Martín',
        direccion: 'Av. San Martín 1234',
        presupuesto: 12000000,
        gastado: 0,
        activo: true,
        creado_en: '2025-01-10'
      },
      {
        id_obra: 2,
        id_cliente: 2,
        id_estado_obra: 2,
        nombre: 'Viviendas Sociales',
        direccion: 'Calle Belgrano 450',
        presupuesto: 8500000,
        gastado: 0,
        activo: true,
        creado_en: '2025-01-15'
      },
      {
        id_obra: 3,
        id_cliente: 3,
        id_estado_obra: 3,
        nombre: 'Complejo Los Álamos',
        direccion: 'Ruta 9 Km 24',
        fecha_inicio: '2025-02-01',
        presupuesto: 15000000,
        gastado: 2000000,
        activo: true,
        creado_en: '2025-01-20'
      },
      {
        id_obra: 4,
        id_cliente: 4,
        id_estado_obra: 4,
        nombre: 'Escuela Primaria N°45',
        direccion: 'Av. Colón 890',
        fecha_inicio: '2025-02-10',
        presupuesto: 6000000,
        gastado: 1500000,
        activo: true,
        creado_en: '2025-01-25'
      },
      {
        id_obra: 5,
        id_cliente: 5,
        id_estado_obra: 5,
        nombre: 'Torre Residencial',
        direccion: 'Bv. Illia 3200',
        fecha_inicio: '2024-12-01',
        fecha_fin: '2025-06-30',
        presupuesto: 25000000,
        gastado: 12500000,
        activo: true,
        creado_en: '2024-11-15'
      },
      {
        id_obra: 6,
        id_cliente: 6,
        id_estado_obra: 6,
        nombre: 'Planta Industrial',
        direccion: 'Zona Franca Córdoba',
        fecha_inicio: '2024-08-01',
        fecha_fin: '2025-01-31',
        presupuesto: 18000000,
        gastado: 18000000,
        activo: true,
        creado_en: '2024-07-01'
      },
      {
        id_obra: 7,
        id_cliente: 7,
        id_estado_obra: 7,
        nombre: 'Country Club',
        direccion: 'Camino a Carlos Paz',
        presupuesto: 30000000,
        gastado: 500000,
        activo: true,
        creado_en: '2024-10-20'
      }
    ];

    this.obrasFiltradas = [...this.obras];
  }

  applyFilter() {
    this.obrasFiltradas = this.obras.filter(obra => {
      const matchesSearch = this.searchValue
        ? obra.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (obra.direccion?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        this.getClienteNombre(obra.id_cliente).toLowerCase().includes(this.searchValue.toLowerCase())
        : true;

      const matchesEstado = this.estadoFiltro === 'todos'
        ? true
        : this.getEstadoLabel(obra.id_estado_obra).toLowerCase() === this.estadoFiltro.toLowerCase();

      return matchesSearch && matchesEstado;
    });
  }

  onEstadoChange() {
    this.applyFilter();
  }

  onRowClick(obra: Obra) {
    this.obraClick.emit(obra);
    this.router.navigate(['/obras', obra.id_obra]);
  }

  // Helpers
  getClienteNombre(id_cliente: number): string {
    return this.clientesMap[id_cliente] || '—';
  }

  getEstadoLabel(id_estado: number): string {
    return this.estadosMap[id_estado] || '—';
  }

  getEstadoSeverity(id_estado: number): string {
    const severities: { [id: number]: string } = {
      1: 'secondary',
      2: 'info',
      3: 'success',
      4: 'success',
      5: 'warning',
      6: 'contrast',
      7: 'danger'
    };
    return severities[id_estado] || 'secondary';
  }

  getProgreso(obra: Obra): number {
    if (!obra.presupuesto || obra.presupuesto === 0) return 0;
    return Math.round(((obra.gastado ?? 0) / obra.presupuesto) * 100);
  }
}
