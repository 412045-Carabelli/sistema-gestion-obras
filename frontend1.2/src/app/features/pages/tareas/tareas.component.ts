import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {forkJoin} from 'rxjs';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {Tarea, Obra} from '../../../core/models/models';
import {ButtonModule} from 'primeng/button';
import {Router} from '@angular/router';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ProgressSpinnerModule, ButtonModule, EstadoFormatPipe],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css']
})
export class TareasComponent implements OnInit {
  loading = true;
  tareas: (Tarea & { obraNombre?: string })[] = [];

  constructor(
    private tareasService: TareasService,
    private obrasService: ObrasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTareas();
  }

  private cargarTareas() {
    this.loading = true;
    this.obrasService.getObras().subscribe({
      next: obras => {
        const mapaObras = new Map<number | undefined, string>(obras.map((o: Obra) => [o.id, o.nombre]));
        const solicitudes = obras.map(o => this.tareasService.getTareasByObra(o.id!));
        if (!solicitudes.length) {
          this.loading = false;
          return;
        }
        forkJoin(solicitudes).subscribe({
          next: res => {
            this.tareas = res.flat().map(t => ({
              ...t,
              obraNombre: mapaObras.get(t.id_obra) || 'Sin referencia'
            })).sort((a, b) => (b.id || 0) - (a.id || 0));
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  irAObra(id: number | undefined) {
    if (id) {
      this.router.navigate(['/obras', id]);
    }
  }
}
