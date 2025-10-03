import {Component, Input, numberAttribute, OnInit} from '@angular/core';
import {NgIf, NgFor, CurrencyPipe, NgClass} from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ObraCosto } from '../../../core/models/models';

@Component({
  selector: 'app-obra-presupuesto',
  standalone: true,
  imports: [CurrencyPipe, TableModule, ButtonModule, NgClass],
  templateUrl: './obra-presupuesto.component.html',
})
export class ObraPresupuestoComponent implements OnInit {
  @Input() obraId!: number;

  costos: ObraCosto[] = [
    {
      id_obra_costo: 1,
      id_obra: 1,
      descripcion: 'Albañilería',
      unidad: 'jornales',
      cantidad: 20,
      precio_unitario: 15000,
      subtotal: 300000,
      total: 363000,
      activo: true
    },
    {
      id_obra_costo: 2,
      id_obra: 1,
      descripcion: 'Cemento Portland',
      unidad: 'bolsas',
      cantidad: 100,
      precio_unitario: 2500,
      subtotal: 250000,
      total: 302500,
      activo: true
    }
  ];

  costosFiltrados: ObraCosto[] = [];

  ngOnInit() {
    this.costosFiltrados = this.costos.filter(c => c.id_obra === this.obraId);
    console.log(this.costosFiltrados);
  }

  calcularTotal(): number {
    return this.costosFiltrados.reduce((acc, c) => acc + (c.total ?? 0), 0);
  }

  exportarPDF() {
    // TODO: Implementar generación y descarga de PDF
    console.log('Exportar a PDF');
  }
}
