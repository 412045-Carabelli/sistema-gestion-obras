import {Component, Input} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {CardModule} from 'primeng/card';
import {ProgressBarModule} from 'primeng/progressbar';

@Component({
  selector: 'app-obra-resumen',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    CardModule,
    ProgressBarModule
  ],
  templateUrl: './obra-resumen.component.html',
  styleUrls: ['./obra-resumen.component.css']
})
export class ObraResumenComponent {
  @Input() totalObras: number = 0;
  @Input() presupuestoTotal: number = 0;
  @Input() gastadoTotal: number = 0;
  @Input() progresoTotal: number = 0;

  get restante(): number {
    return this.presupuestoTotal - this.gastadoTotal;
  }
}
