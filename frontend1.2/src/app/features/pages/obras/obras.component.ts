import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {Obra, Tarea} from '../../../core/models/models';
import {ObrasListComponent} from '../../components/obra-list/obras-list.component';
import {ObrasService} from '../../../services/obras/obras.service';
import {TareasService} from '../../../services/tareas/tareas.service';

@Component({
  selector: 'app-obras',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ObrasListComponent
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

  constructor(
    private router: Router,
    private obraService: ObrasService,
    private tareaService: TareasService
  ) {
  }

  ngOnInit() {
    this.obraService.getObras().subscribe(obras => {
      console.log(obras)
      this.obras = obras;
    });
  }

  calcularTotales(tareas: Tarea[]) {
    this.totalObras = this.obras.length;
    this.presupuestoTotal = this.obras.reduce((sum, o) => sum + (o.presupuesto ?? 0), 0);
    this.gastadoTotal = this.obras.reduce((sum, o) => sum + (o.gastado ?? 0), 0);

    const progresosObras = this.obras.map(obra => {
      const tareasObra = tareas.filter(t => t.id_obra === obra.id);
      if (tareasObra.length === 0) return 0;

      const completadas = tareasObra.filter(t => t.estado_tarea.id === 3).length; // 3 = completada
      return (completadas / tareasObra.length) * 100;
    });

    this.progresoTotal = progresosObras.length > 0
      ? Math.round(progresosObras.reduce((a, b) => a + b, 0) / progresosObras.length)
      : 0;
  }


  nuevaObra() {
    this.router.navigate(['/obras/nueva']);
  }

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id]);
  }
}
