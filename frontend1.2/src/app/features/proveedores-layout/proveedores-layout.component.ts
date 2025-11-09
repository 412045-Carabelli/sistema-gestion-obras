import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { filter, Subscription } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
import {ProveedoresStateService} from '../../services/proveedores/proveedores-state.service';

@Component({
  selector: 'app-proveedores-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastModule,
    ProgressSpinnerModule,
    RouterLink,
    Button,
    Tooltip
  ],
  providers: [MessageService],
  templateUrl: './proveedores-layout.component.html',
  styleUrls: ['./proveedores-layout.component.css']
})
export class ProveedoresLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  proveedor?: any; // Reemplaza 'any' con tu tipo Proveedor

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private proveedorStateService: ProveedoresStateService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        if (!this.isDetail()) {
          this.proveedor = undefined;
          this.proveedorStateService.clearProveedor(); // Descomenta cuando tengas el servicio
        }
      });
  }

  ngOnInit() {
    this.subscription.add(
      this.proveedorStateService.proveedorActual$.subscribe(proveedor => {
        this.proveedor = proveedor || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/proveedores']);
  }

  isDetail(): boolean {
    return /^\/proveedores\/\d+$/.test(this.currentRoute);
  }
}
