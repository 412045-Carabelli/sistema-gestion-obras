import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ChangelogService} from '../../services/changelog/changelog.service';

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
export class SidebarComponent {
  @Input() visible: boolean = true;

  constructor(private changelogService: ChangelogService) {}

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

  version: string = 'v1.17.25';
}
