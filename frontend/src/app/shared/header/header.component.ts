import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { ConfiguracionService, CONFIG_KEYS } from '../../services/configuracion/configuracion.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleMenu = new EventEmitter<void>();

  userName = 'Pablo Pezzini';
  logoUrl = '/logo-meliquina.png';

  private sub = new Subscription();

  constructor(private configuracionService: ConfiguracionService) {}

  ngOnInit(): void {
    this.sub.add(
      this.configuracionService.config$.subscribe(config => {
        if (config[CONFIG_KEYS.PROPIETARIO_NOMBRE]) {
          this.userName = config[CONFIG_KEYS.PROPIETARIO_NOMBRE];
        }
        if (config[CONFIG_KEYS.LOGO_URL]) {
          this.logoUrl = config[CONFIG_KEYS.LOGO_URL];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onToggleMenu() {
    this.toggleMenu.emit();
  }
}
