import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  contactForm!: FormGroup;
  mobileMenuOpen = false;
  scrolled = false;
  isLoggedIn = false;
  private observer!: IntersectionObserver;

  features = [
    { icon: 'pi pi-building', title: 'Gestión de Obras', desc: 'Seguí cada etapa de tus proyectos: presupuesto, estado, responsables y fechas en un solo lugar.' },
    { icon: 'pi pi-calculator', title: 'Presupuestos', desc: 'Calculá costos detallados por rubro, gremio y proveedor. Exportá y comparaá sin esfuerzo.' },
    { icon: 'pi pi-truck', title: 'Proveedores', desc: 'Administrá tu red de proveedores y gremios con historial de pagos y saldos en tiempo real.' },
    { icon: 'pi pi-users', title: 'Clientes', desc: 'Registrá clientes, vinculalos a obras y controlá su cuenta corriente con total transparencia.' },
    { icon: 'pi pi-file-edit', title: 'Facturas', desc: 'Emití y gestioná facturas por obra. Controlá cobros parciales, totales y estados de pago.' },
    { icon: 'pi pi-arrow-right-arrow-left', title: 'Movimientos', desc: 'Registrá ingresos y egresos por obra. Visualizá el flujo de caja en tiempo real.' },
    { icon: 'pi pi-calendar', title: 'Agenda & Tareas', desc: 'Organizá reuniones, vencimientos y tareas del equipo. Nunca pierdas un hito importante.' },
    { icon: 'pi pi-chart-line', title: 'Reportes', desc: 'Dashboard financiero, deudas globales, flujo de caja y rentabilidad por obra de un vistazo.' },
  ];

  plans = [
    {
      name: 'Starter',
      price: '—',
      desc: 'Ideal para empresas pequeñas que arrancan su digitalización.',
      features: ['Hasta 5 obras activas', '2 usuarios', 'Módulos básicos', 'Soporte por email'],
      highlight: false
    },
    {
      name: 'Pro',
      price: '—',
      desc: 'Para empresas en crecimiento con múltiples proyectos activos.',
      features: ['Obras ilimitadas', '10 usuarios', 'Todos los módulos', 'Reportes avanzados', 'Soporte prioritario'],
      highlight: true
    },
    {
      name: 'Enterprise',
      price: '—',
      desc: 'Solución a medida para grandes constructoras.',
      features: ['Obras ilimitadas', 'Usuarios ilimitados', 'Integraciones custom', 'SLA dedicado', 'Onboarding guiado'],
      highlight: false
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getCurrentUser();
    this.contactForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      empresa: [''],
      mensaje: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
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
