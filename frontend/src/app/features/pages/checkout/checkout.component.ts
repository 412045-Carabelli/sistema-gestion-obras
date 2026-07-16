import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { MercadoPagoService } from '../../../services/mercadopago/mercadopago.service';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, LayoutHeaderComponent],
  providers: [MessageService]
})
export class CheckoutComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private mpService = inject(MercadoPagoService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  planCodigo = signal('');
  ciclo = signal<'MENSUAL' | 'ANUAL'>('MENSUAL');
  planDetalle = signal<any>(null);
  cargando = signal(true);
  procesando = signal(false);

  form: FormGroup = this.fb.group({
    codigoDescuento: ['']
  });

  ngOnInit(): void {
    const planParam = this.route.snapshot.queryParamMap.get('plan') ?? '';
    const cicloParam = this.route.snapshot.queryParamMap.get('ciclo') ?? 'mensual';
    this.planCodigo.set(planParam.toUpperCase());
    this.ciclo.set(cicloParam.toUpperCase() as 'MENSUAL' | 'ANUAL');
    this.cargarPlan();
  }

  private cargarPlan(): void {
    this.http.get<any[]>(`${environment.apiGateway}/auth/planes`).pipe(
      catchError(() => of([]))
    ).subscribe(planes => {
      const plan = planes.find(p => p.codigo === this.planCodigo());
      this.planDetalle.set(plan ?? null);
      this.cargando.set(false);
    });
  }

  get precioDisplay(): string {
    const p = this.planDetalle();
    if (!p) return '';
    const precio = this.ciclo() === 'ANUAL'
      ? Number(p.precioAnualUsd)
      : Number(p.precioMensualUsd);
    return `USD ${precio.toFixed(2)} / ${this.ciclo() === 'ANUAL' ? 'año' : 'mes'}`;
  }

  get precioNota(): string {
    return 'El precio se muestra en USD como referencia. El cobro se realiza en su equivalente en pesos argentinos al tipo de cambio del día.';
  }

  confirmar(): void {
    const plan = this.planDetalle();
    if (!plan) return;

    this.procesando.set(true);
    const codigoDescuento = this.form.get('codigoDescuento')?.value?.trim() || undefined;

    this.mpService.iniciarSuscripcion({
      planId: plan.id,
      ciclo: this.ciclo(),
      codigoDescuento
    }).pipe(
      catchError(err => {
        const msg = err?.error?.message ?? 'Error al iniciar el pago. Intentá más tarde.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        this.procesando.set(false);
        return of(null);
      })
    ).subscribe(res => {
      if (res?.initPoint) {
        const montoArs = res.montoArs != null ? Number(res.montoArs).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : null;
        if (montoArs) {
          this.messageService.add({
            severity: 'info',
            summary: 'Redirigiendo a Mercado Pago',
            detail: `Se cobrará ARS ${montoArs} (equivalente a ${this.precioDisplay} al tipo de cambio del día)`,
            life: 4000
          });
        }
        setTimeout(() => {
          window.location.href = res.initPoint;
        }, montoArs ? 1500 : 0);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/planes']);
  }
}
