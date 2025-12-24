import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {DatePipe} from '@angular/common';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {filter, Subscription} from 'rxjs';
import {Factura} from '../../core/models/models';
import {FacturasStateService} from '../../services/facturas/facturas-state.service';

@Component({
  selector: 'app-facturas-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, RouterLink, Button, Tooltip, DatePipe],
  providers: [MessageService],
  templateUrl: './facturas-layout.component.html',
  styleUrls: ['./facturas-layout.component.css']
})
export class FacturasLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  factura?: Factura;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private facturasStateService: FacturasStateService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        if (!this.isDetail()) {
          this.factura = undefined;
          this.facturasStateService.clearFactura();
        }
      });
  }

  ngOnInit() {
    this.subscription.add(
      this.facturasStateService.facturaActual$.subscribe(factura => {
        this.factura = factura || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/facturas']);
  }

  isDetail(): boolean {
    return /^\/facturas\/\d+$/.test(this.currentRoute);
  }
}
