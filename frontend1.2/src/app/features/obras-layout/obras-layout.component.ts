import {Component} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {ToastModule} from 'primeng/toast';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {filter} from 'rxjs';

@Component({
  selector: 'app-obras-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ProgressSpinnerModule, RouterLink, Button],
  providers: [MessageService],
  templateUrl: './obras-layout.component.html',
  styleUrls: ['./obras-layout.component.css']
})
export class ObrasLayoutComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  goBack() {
    this.router.navigate(['/obras']);
  }

  isDetail(): boolean {
    return /^\/obras\/\d+$/.test(this.currentRoute);
  }
}
