import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { PlanService } from '../../services/plan/plan.service';

/**
 * Bloquea el acceso a la app si la suscripción de la organización no está
 * ACTIVA o en TRIAL: plan vencido, pago rechazado/suspendido/cancelado, o
 * sin ningún plan contratado (FREE). Redirige a /planes para que elija/pague.
 *
 * No aplicar en /planes, /mi-plan, /checkout, /configuracion ni /suscripcion/**
 * — son las rutas que el usuario necesita para poder resolver el bloqueo.
 */
export const planActivoGuard: CanActivateFn = () => {
  const planService = inject(PlanService);
  const router = inject(Router);

  return planService.verificarAcceso().pipe(
    map(({ ok, estado }) => {
      if (ok) return true;
      // FREE = nunca contrató nada (usuario nuevo) → no mostrar cartel de "suscripción no activa"
      const queryParams = estado !== 'FREE' ? { bloqueado: 1 } : {};
      return router.createUrlTree(['/planes'], { queryParams });
    })
  );
};
