import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ChangelogService} from '../../services/changelog/changelog.service';
import {ConfiguracionService, CONFIG_KEYS} from '../../services/configuracion/configuracion.service';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() visible: boolean = true;
  @Output() navClicked = new EventEmitter<void>();

  logoUrl: string = '';
  empresaNombre: string = '';

  constructor(
    private changelogService: ChangelogService,
    private configuracionService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.configuracionService.config$.subscribe(config => {
      this.logoUrl = config[CONFIG_KEYS.LOGO_URL] || '';
      this.empresaNombre = config[CONFIG_KEYS.EMPRESA_NOMBRE] || '';
    });
  }

  abrirChangelog(): void {
    this.changelogService.abrir();
  }

  menuGroups: MenuGroup[] = [
    {
      label: 'Principal',
      items: [
        {label: 'Dashboard', icon: 'pi-home', path: '/dashboard'}
      ]
    },
    {
      label: 'Gestión de Obras',
      items: [
        {label: 'Obras', icon: 'pi-building', path: '/obras'},
        {label: 'Agendas', icon: 'pi-calendar', path: '/agendas'},
        {label: 'Clientes', icon: 'pi-users', path: '/clientes'},
        {label: 'Proveedores', icon: 'pi-truck', path: '/proveedores'}
      ]
    },
    {
      label: 'Financiero',
      items: [
        {label: 'Movimientos', icon: 'pi-arrow-right-arrow-left', path: '/movimientos'},
        {label: 'Facturas', icon: 'pi-receipt', path: '/facturas'},
        {label: 'Cuentas Corrientes', icon: 'pi-wallet', path: '/cuentas-corrientes'}
      ]
    },
    {
      label: 'Reportes',
      items: [
        {label: 'Reportes', icon: 'pi-chart-bar', path: '/reportes'}
      ]
    }
  ];

  version: string = 'v1.17.29';
}
