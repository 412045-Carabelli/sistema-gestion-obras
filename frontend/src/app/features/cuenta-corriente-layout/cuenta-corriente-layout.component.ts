import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { Button } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { filter } from 'rxjs';
import { BackButtonDirective } from '../../shared/directives/back-button.directive';

@Component({
  selector: 'app-cuenta-corriente-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialog, TagModule, Button, BackButtonDirective],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cuenta-corriente-layout.component.html',
  styleUrls: ['./cuenta-corriente-layout.component.css']
})
export class CuentaCorrienteLayoutComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
  }

  goBack() {
    this.router.navigate(['/cuentas-corrientes']);
  }
}
