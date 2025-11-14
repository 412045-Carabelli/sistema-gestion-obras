import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CurrencyPipe, DatePipe, NgClass} from '@angular/common';
import {forkJoin, Subscription} from 'rxjs';

import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressBarModule} from 'primeng/progressbar';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {Select} from 'primeng/select';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';

import {Cliente, EstadoObra, Obra, ObraCosto, Proveedor, Tarea} from '../../../core/models/models';
import {ObraMovimientosComponent} from '../../components/obra-movimientos/obra-movimientos.component';
import {ObraTareasComponent} from '../../components/obra-tareas/obra-tareas.component';
import {ObraPresupuestoComponent} from '../../components/obra-presupuesto/obra-presupuesto.component';

import {ObrasService} from '../../../services/obras/obras.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {ObraDocumentosComponent} from '../../components/obra-documentos/obra-documentos.component';

import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasStateService} from '../../../services/obras/obras-state.service';
import {StyleClass} from 'primeng/styleclass';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
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
    StyleClass,
    NgClass,
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
  clientes!: Cliente[];
  progresoFisico = 0;
  estadosObra: EstadoObra[] = [];
  estadoSeleccionado: string | null = null;

  loading = true;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private obraService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private messageService: MessageService,
    private obraStateService: ObrasStateService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.obraStateService.clearObra();
  }

  actualizarEstadoObra(nuevoEstado: string) {
    console.log(nuevoEstado)
    this.obraService.updateEstadoObra(this.obra.id!, nuevoEstado).subscribe({
      next: () => {
        const encontrado = this.estadosObra.find(e => e.name === nuevoEstado);
        if (encontrado) {
          this.obra.obra_estado = encontrado.label;
        }

        this.estadoSeleccionado = nuevoEstado;
        this.obraStateService.setObra(this.obra);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `La obra ahora está en estado "${this.obra.obra_estado}".`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Estado actualizado',
          detail: 'El estado de la obra no se pudo actualizar',
        })
      }
    });
  }

  private cargarDetalle(idObra: number) {
    this.loading = true;

    forkJoin({
      obra: this.obraService.getObraById(idObra),
      estados: this.estadoObraService.getEstados(),
      proveedores: this.proveedoresService.getProveedores(),
      clientes: this.clientesService.getClientes(),
    }).subscribe({

      next: ({ obra, estados, proveedores, clientes }) => {
        console.log(obra)
        this.obra = { ...obra, id: Number(obra.id) };
        this.tareas = obra.tareas ?? [];
        this.costos = obra.costos ?? [];
        this.estadosObra = estados;

        this.estadoSeleccionado = obra.obra_estado;

        this.clientes = clientes;

        const proveedoresIdsDeObra = (this.costos ?? [])
          .map(c => c.proveedor?.id)
          .filter((id): id is number => id !== undefined);

        this.proveedores = proveedores.filter(p =>
          proveedoresIdsDeObra.includes(p.id)
        );

        this.progresoFisico = this.getProgresoFisico();
        this.loading = false;
        this.obraStateService.setObra(this.obra);
      },

      error: () => {
        this.loading = false;
        this.obraStateService.clearObra();
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar la obra',
          detail: 'No se pudo obtener la información de la obra.'
        });
      }
    });
  }

  onCostosActualizados(costosActualizados: ObraCosto[]) {
    this.costos = costosActualizados;
    this.obra.costos = costosActualizados;
    this.obraStateService.setObra(this.obra);
  }

  getProgresoFisico(): number {
    if (!this.tareas.length || !this.proveedores.length) return 0;

    const tareasDeEstaObra = this.tareas.filter(t =>
      this.proveedores.some(p => p.id === t.proveedor?.id)
    );

    if (!tareasDeEstaObra.length) return 0;

    const completadas = tareasDeEstaObra
      .filter(t => t.estado_tarea?.toLowerCase() === 'completada')
      .length;

    return Math.round((completadas / tareasDeEstaObra.length) * 100);
  }

  onTareasActualizadas(nuevasTareas: Tarea[]) {
    this.tareas = nuevasTareas;
    this.obra.tareas = nuevasTareas;

    // Recalcular progreso con los nuevos estados
    this.progresoFisico = this.getProgresoFisico();

    // Guardar estado en el service global
    this.obraStateService.setObra(this.obra);

    // Opcional: mostrar un toast
    this.messageService.add({
      severity: 'success',
      summary: 'Tareas actualizadas',
      detail: 'Se actualizaron correctamente las tareas de esta obra.'
    });
  }

  toggleActivo() {
    this.obraService.activarObra(this.obra.id!).subscribe({
      next: (c) => {
        this.messageService.add({
          severity: 'success',
          summary: this.obra.activo ? 'Obra activada' : 'Obra desactivada',
          detail: `La obra fue ${this.obra.activo ? 'activada' : 'desactivada'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la obra.'
        });
      }
    });
  }

}
