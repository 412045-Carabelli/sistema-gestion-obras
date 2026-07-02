import { Component, Input, Output, EventEmitter, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ChangelogService } from '../../services/changelog/changelog.service';
import { ConfiguracionService, CONFIG_KEYS } from '../../services/configuracion/configuracion.service';
import { PlanService } from '../../services/plan/plan.service';
import { PlanFeature } from '../../core/models/models';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  feature?: PlanFeature;  // null = siempre visible; definido = requiere feature
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() visible: boolean = true;
  @Output() navClicked = new EventEmitter<void>();

  logoUrl: string = '';
  empresaNombre: string = '';

  private changelogService = inject(ChangelogService);
  private configuracionService = inject(ConfiguracionService);
  planService = inject(PlanService);
  router = inject(Router);

  ngOnInit(): void {
    this.configuracionService.config$.subscribe(config => {
      this.logoUrl = config[CONFIG_KEYS.LOGO_URL] || '';
      this.empresaNombre = config[CONFIG_KEYS.EMPRESA_NOMBRE] || '';
    });
  }

  abrirChangelog(): void {
    this.changelogService.abrir();
  }

  isLocked(item: MenuItem): boolean {
    if (!item.feature) return false;
    return this.planService.isLocked(item.feature);
  }

  navegarItem(item: MenuItem): void {
    if (this.isLocked(item)) {
      this.router.navigate(['/planes'], { queryParams: { feature: item.feature } });
      return;
    }
    this.router.navigate([item.path]);
    this.navClicked.emit();
  }

  menuGroups: MenuGroup[] = [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'pi-home', path: '/dashboard' }
      ]
    },
    {
      label: 'Gestión de Obras',
      items: [
        { label: 'Obras',       icon: 'pi-building',  path: '/obras' },
        { label: 'Agendas',     icon: 'pi-calendar',  path: '/agendas',    feature: 'agenda' },
        { label: 'Clientes',    icon: 'pi-users',     path: '/clientes' },
        { label: 'Proveedores', icon: 'pi-truck',     path: '/proveedores' }
      ]
    },
    {
      label: 'Financiero',
      items: [
        { label: 'Movimientos',        icon: 'pi-arrow-right-arrow-left', path: '/movimientos' },
        { label: 'Facturas',           icon: 'pi-receipt',                path: '/facturas',          feature: 'facturas' },
        { label: 'Cuentas Corrientes', icon: 'pi-wallet',                 path: '/cuentas-corrientes' }
      ]
    },
    {
      label: 'Reportes',
      items: [
        { label: 'Reportes', icon: 'pi-chart-bar', path: '/reportes' }
      ]
    }
  ];

  version: string = 'v1.17.41';
}
