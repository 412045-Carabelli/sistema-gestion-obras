import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { filter } from 'rxjs';

@Component({
  selector: 'app-proveedores-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ProgressSpinnerModule, RouterLink, Button],
  providers: [MessageService],
  templateUrl: './proveedores-layout.component.html',
  styleUrls: ['./proveedores-layout.component.css']
})
export class ProveedoresLayoutComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  goBack() {
    this.router.navigate(['/proveedores']);
  }

  isDetail(): boolean {
    return /^\/proveedores\/\d+$/.test(this.currentRoute);
  }
}
