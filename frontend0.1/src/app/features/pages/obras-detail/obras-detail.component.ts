import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { EstadoObra, Obra, Proveedor, Tarea, ObraCosto } from '../../../core/models/models';
import { ObraMovimientosComponent } from '../../components/obra-movimientos/obra-movimientos.component';
import { ObraTareasComponent } from '../../components/obra-tareas/obra-tareas.component';
import { ObraPresupuestoComponent } from '../../components/obra-presupuesto/obra-presupuesto.component';
import { ObrasService } from '../../../services/obras/obras.service';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import { EstadoObraService } from '../../../services/estado-obra/estado-obra.service';
import { ObraDocumentosComponent } from '../../components/obra-documentos/obra-documentos.component';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    DropdownModule,
    ObraMovimientosComponent,
    ObraTareasComponent,
    ObraPresupuestoComponent,
    CurrencyPipe,
    DatePipe,
    Select,
    FormsModule,
    ToastModule,
    ObraDocumentosComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  providers: [MessageService],
  templateUrl: './obras-detail.component.html',
  styleUrls: ['./obras-detail.component.css']
})
export class ObrasDetailComponent implements OnInit, OnDestroy {
  obra!: Obra;
  tareas: Tarea[] = [];
  costos: ObraCosto[] = [];
  proveedores!: Proveedor[];
  progresoFisico = 0;
  estadosObra: EstadoObra[] = [];
  loading = true;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private obraService: ObrasService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private cargarDetalle(idObra: number) {
    this.loading = true;

    forkJoin({
      obra: this.obraService.getObraById(idObra),
      estados: this.estadoObraService.getEstados(),
      proveedores: this.proveedoresService.getProveedores()
    }).subscribe({
      next: ({ obra, estados, proveedores }) => {
        this.obra = {
          ...obra,
          id: Number(obra.id),
          obra_estado: obra.obra_estado
            ? { ...obra.obra_estado, id: Number(obra.obra_estado.id) }
            : (undefined as any)
        };

        this.tareas = obra.tareas ?? [];
        this.costos = obra.costos ?? [];
        this.estadosObra = estados.map(e => ({ ...e, id: Number(e.id) }));

        const proveedoresIdsDeObra = (this.costos ?? [])
          .map(costo => costo.proveedor?.id)
          .filter((id): id is number => id !== undefined);

        this.proveedores = proveedores.filter(p =>
          proveedoresIdsDeObra.includes(p.id)
        );

        this.progresoFisico = this.getProgresoFisico();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar la obra',
          detail: 'No se pudo obtener la información de la obra seleccionada.'
        });
      }
    });
  }

  onTareasActualizadas(nuevasTareas: Tarea[]) {
    this.tareas = nuevasTareas;
    this.obra.tareas = nuevasTareas;
    this.progresoFisico = this.getProgresoFisico();
  }

  actualizarEstadoObra(nuevoEstadoId: number) {
    const nuevoEstado = this.estadosObra.find(e => e.id === nuevoEstadoId);
    if (!nuevoEstado) return;

    this.obraService.updateEstadoObra(this.obra.id!, nuevoEstado.id).subscribe({
      next: () => {
        this.obra.obra_estado = nuevoEstado;
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `La obra ahora está en estado "${nuevoEstado.nombre}".`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al actualizar',
          detail: 'No se pudo actualizar el estado de la obra.'
        });
      }
    });
  }

  getProgresoFisico(): number {
    if (!this.tareas.length || !this.proveedores.length) return 0;

    const tareasDeEstaObra = this.tareas.filter(t =>
      this.proveedores.some(p => p.id === t.proveedor.id)
    );

    if (!tareasDeEstaObra.length) return 0;

    const completadas = tareasDeEstaObra.filter(
      t => t.estado_tarea?.nombre?.toLowerCase() === 'completada'
    ).length;

    return Math.round((completadas / tareasDeEstaObra.length) * 100);
  }

}
