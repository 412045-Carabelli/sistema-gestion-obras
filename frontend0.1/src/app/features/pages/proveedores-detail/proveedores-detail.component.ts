import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import { TareasService } from '../../../services/tareas/tareas.service';
import { ObrasService } from '../../../services/obras/obras.service';
import { Proveedor, Tarea, Obra } from '../../../core/models/models';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-proveedores-detail',
  standalone: true,
  imports: [
    ButtonModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ProgressSpinnerModule,
    TableModule, RouterLink, Tooltip
  ],
  templateUrl: './proveedores-detail.component.html'
})
export class ProveedoresDetailComponent implements OnInit, OnDestroy {
  proveedor!: Proveedor;
  tareas: Tarea[] = [];
  obrasMap: Record<number, Obra> = {};  // Mapa id_obra -> Obra
  loading = true;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proveedoresService: ProveedoresService,
    private tareasService: TareasService,
    private obrasService: ObrasService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private cargarDetalle(id: number) {
    this.loading = true;
    forkJoin({
      proveedor: this.proveedoresService.getProveedorById(id),
      tareas: this.tareasService.getTareasByProveedor(id)
    }).subscribe({
      next: ({ proveedor, tareas }) => {
        this.proveedor = proveedor;
        this.tareas = tareas;

        // 📡 Traer las obras asociadas a las tareas
        const obraIds = Array.from(new Set(tareas.map(t => t.id_obra)));
        if (obraIds.length > 0) {
          forkJoin(obraIds.map(id => this.obrasService.getObraById(id)))
            .subscribe({
              next: obras => {
                this.obrasMap = obras.reduce((acc, obra) => {
                  acc[obra.id!] = obra;
                  return acc;
                }, {} as Record<number, Obra>);
                this.loading = false;
              },
              error: () => (this.loading = false)
            });
        } else {
          this.loading = false;
        }
      },
      error: () => (this.loading = false)
    });
  }

  getNombreObra(idObra: number): string {
    return this.obrasMap[idObra]?.nombre ?? `Obra #${idObra}`;
  }

  irADetalleObra(idObra: number) {
    this.router.navigate(['/obras', idObra]);
  }
}
