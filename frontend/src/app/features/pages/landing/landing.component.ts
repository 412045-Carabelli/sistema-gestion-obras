import { Component, OnInit, OnDestroy, HostListener, AfterViewInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../services/auth/auth.service';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface PlanLanding {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  highlight: boolean;
  badge?: string;
  limites: string[];
  features: { label: string; incluido: boolean }[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private http = inject(HttpClient);

  contactForm!: FormGroup;
  mobileMenuOpen = false;
  scrolled = false;
  isLoggedIn = false;
  private observer!: IntersectionObserver;

  planes = signal<PlanLanding[]>([]);
  cargandoPlanes = signal(true);

  features = [
    { icon: 'pi pi-building',               title: 'Gestión de Obras',    desc: 'Seguí cada etapa de tus proyectos: presupuesto, estado, responsables y fechas en un solo lugar.' },
    { icon: 'pi pi-calculator',             title: 'Presupuestos',         desc: 'Calculá costos detallados por rubro, gremio y proveedor. Exportá y comparaá sin esfuerzo.' },
    { icon: 'pi pi-truck',                  title: 'Proveedores',          desc: 'Administrá tu red de proveedores y gremios con historial de pagos y saldos en tiempo real.' },
    { icon: 'pi pi-users',                  title: 'Clientes',             desc: 'Registrá clientes, vinculalos a obras y controlá su cuenta corriente con total transparencia.' },
    { icon: 'pi pi-file-edit',              title: 'Facturas',             desc: 'Emití y gestioná facturas por obra. Controlá cobros parciales, totales y estados de pago.' },
    { icon: 'pi pi-arrow-right-arrow-left', title: 'Movimientos',         desc: 'Registrá ingresos y egresos por obra. Visualizá el flujo de caja en tiempo real.' },
    { icon: 'pi pi-calendar',              title: 'Agenda & Tareas',       desc: 'Organizá reuniones, vencimientos y tareas del equipo. Nunca pierdas un hito importante.' },
    { icon: 'pi pi-chart-line',            title: 'Reportes',              desc: 'Dashboard financiero, deudas globales, flujo de caja y rentabilidad por obra de un vistazo.' },
  ];

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getCurrentUser();
    this.contactForm = this.fb.group({
      nombre:  ['', Validators.required],
      email:   ['', [Validators.required, Validators.email]],
      empresa: [''],
      mensaje: ['', Validators.required]
    });
    this.cargarPlanes();
  }

  private cargarPlanes(): void {
    this.http.get<any[]>(`${environment.apiGateway}/auth/planes`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      const activos = data
        .filter(p => p.activo && p.codigo !== 'FREE')
        .map(p => this.mapPlan(p));
      this.planes.set(activos);
      this.cargandoPlanes.set(false);
    });
  }

  private mapPlan(p: any): PlanLanding {
    const codigo = p.codigo as string;
    return {
      id: p.id,
      codigo,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precioMensual: Number(p.precioMensualUsd ?? 0),
      highlight: codigo === 'PROFESIONAL',
      badge:     codigo === 'PROFESIONAL' ? 'Más popular' : undefined,
      limites: this.buildLimites(p),
      features: this.buildFeatures(p),
    };
  }

  private buildLimites(p: any): string[] {
    const l: string[] = [];
    l.push(p.maxUsuarios     ? `${p.maxUsuarios} usuario${p.maxUsuarios > 1 ? 's' : ''}` : 'Usuarios ilimitados');
    l.push(p.maxObrasActivas ? `${p.maxObrasActivas} obras activas`   : 'Obras ilimitadas');
    l.push(p.maxClientes     ? `${p.maxClientes} clientes`            : 'Clientes ilimitados');
    if (p.maxStorageMb) l.push(this.formatStorage(p.maxStorageMb));
    return l;
  }

  private buildFeatures(p: any): { label: string; incluido: boolean }[] {
    return [
      { label: 'Gestión de obras y clientes',    incluido: true },
      { label: 'Proveedores y transacciones',     incluido: true },
      { label: 'Diagrama de Gantt',               incluido: !!p.tieneGantt },
      { label: 'Reportería y exportación',        incluido: !!p.tieneExportar },
      { label: 'Agenda de tareas',                incluido: !!p.tieneAgenda },
      { label: 'Grupos de obras',                 incluido: !!p.tieneGruposObras },
      { label: 'Bot de WhatsApp',                 incluido: !!p.tieneWhatsappBot },
      { label: 'Facturación electrónica',         incluido: !!p.tieneFacturas },
      { label: 'Soporte prioritario',             incluido: !!p.tieneSoportePrioritario },
    ];
  }

  private formatStorage(mb: number): string {
    if (mb >= 1024) {
      const gb = mb / 1024;
      return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB storage`;
    }
    return `${mb} MB storage`;
  }

  precio(plan: PlanLanding): string {
    return plan.precioMensual > 0 ? `USD ${plan.precioMensual.toFixed(0)}` : 'Gratis';
  }

  elegirPlan(plan: PlanLanding): void {
    if (plan.codigo === 'ENTERPRISE') {
      this.scrollTo('contact');
      return;
    }
    if (this.isLoggedIn) {
      this.router.navigate(['/checkout'], { queryParams: { plan: plan.codigo, ciclo: 'mensual' } });
    } else {
      // Guarda intención y redirige a crear cuenta (la mayoría no tiene una todavía)
      sessionStorage.setItem('pending_checkout', JSON.stringify({ plan: plan.codigo, ciclo: 'mensual' }));
      this.router.navigate(['/register']);
    }
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => this.observer.observe(el));
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
  }

  openLogin(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.router.navigate(['/login']);
  }

  scrollTo(id: string): void {
    this.mobileMenuOpen = false;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.messageService.add({ severity: 'success', summary: '¡Gracias!', detail: 'Nos pondremos en contacto pronto.' });
    this.contactForm.reset();
  }
}
