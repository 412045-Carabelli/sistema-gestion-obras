import { Component } from '@angular/core';
import {Button} from "primeng/button";
import {NavigationEnd, Router, RouterLink, RouterOutlet} from "@angular/router";
import {Toast} from "primeng/toast";
import {filter} from 'rxjs';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-clientes-layout',
    imports: [
        Button,
        RouterLink,
        RouterOutlet,
        Toast
    ],
  templateUrl: './clientes-layout.component.html',
  styleUrl: './clientes-layout.component.css',
  providers: [MessageService]
})
export class ClientesLayoutComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  goBack() {
    this.router.navigate(['/clientes']);
  }

  isDetail(): boolean {
    return /^\/clientes\/\d+$/.test(this.currentRoute);
  }
}
