import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {ToastModule} from 'primeng/toast';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {filter, Subscription} from 'rxjs';
import {Tooltip} from 'primeng/tooltip';
import {Obra} from '../../core/models/models';
import {ObrasStateService} from '../../services/obras/obras-state.service';

@Component({
  selector: 'app-obras-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ProgressSpinnerModule, RouterLink, Button, Tooltip],
  providers: [MessageService],
  templateUrl: './obras-layout.component.html',
  styleUrls: ['./obras-layout.component.css']
})
export class ObrasLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  obra?: Obra;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private obraStateService: ObrasStateService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        // ⬅️ LIMPIAR OBRA SI NO ESTAMOS EN DETALLE
        if (!this.isDetail()) {
          this.obra = undefined;
          this.obraStateService.clearObra();
        }
      });
  }

  ngOnInit() {
    // Suscribirse al observable de la obra
    this.subscription.add(
      this.obraStateService.obraActual$.subscribe(obra => {
        this.obra = obra || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/obras']);
  }

  isDetail(): boolean {
    return /^\/obras\/\d+$/.test(this.currentRoute);
  }
}
