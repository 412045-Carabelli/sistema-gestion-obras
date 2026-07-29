import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Button} from 'primeng/button';
import {FacturasStateService} from '../../services/facturas/facturas-state.service';
import {LayoutHeaderComponent} from '../../shared/layout-header/layout-header.component';

@Component({
  selector: 'app-facturas-layout',
  standalone: true,
  imports: [RouterOutlet, Button, LayoutHeaderComponent],
  templateUrl: './facturas-layout.component.html',
  styleUrls: ['./facturas-layout.component.css']
})
export class FacturasLayoutComponent {
  constructor(private facturasStateService: FacturasStateService) {
  }

  abrirNuevaFactura() {
    this.facturasStateService.triggerOpenCreate();
  }
}
