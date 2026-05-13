import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {SidebarModule} from 'primeng/sidebar';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() visible: boolean = true;

  menuItems: MenuItem[] = [
    {label: 'Dashboard', icon: 'pi-home', path: '/dashboard'},
    {label: 'Obras', icon: 'pi-building', path: '/obras'},
    {label: 'Agendas', icon: 'pi-calendar', path: '/agendas'},
    {label: 'Clientes', icon: 'pi-users', path: '/clientes'},
    {label: 'Proveedores', icon: 'pi-truck', path: '/proveedores'},
    {label: 'Movimientos', icon: 'pi-arrow-right-arrow-left', path: '/movimientos'},
    {label: 'Facturas', icon: 'pi-receipt', path: '/facturas'},
    {label: 'Reportes', icon: 'pi-chart-bar', path: '/reportes'},
    {label: 'Cuentas Corrientes', icon: 'pi-wallet', path: '/cuentas-corrientes'},
  ];

  version: string = 'v1.15.39';
}
