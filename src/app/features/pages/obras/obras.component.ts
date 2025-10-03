import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Obra } from '../../../core/models/models';
import { ObraResumenComponent } from '../../components/obra-resumen/obra-resumen.component';
import {ObraListComponent} from '../../components/obra-list/obra-list.component';

@Component({
  selector: 'app-obras',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ObraResumenComponent,
    ObraListComponent
  ],
  templateUrl: './obras.component.html',
  styleUrls: ['./obras.component.css']
})
export class ObrasComponent implements OnInit {
  obras: Obra[] = [];
  totalObras = 0;
  presupuestoTotal = 0;
  gastadoTotal = 0;
  progresoTotal = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    // TODO: Llamada API y cálculos
  }

  nuevaObra() {
    this.router.navigate(['/obras/nueva']);
  }

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id_obra]);
  }
}
