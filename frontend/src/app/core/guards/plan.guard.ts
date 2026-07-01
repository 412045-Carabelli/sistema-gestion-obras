import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PlanService } from '../../services/plan/plan.service';
import { PlanFeature } from '../models/models';

/**
 * Guard de plan: bloquea rutas que requieren una feature específica.
 *
 * Uso en routes:
 *   {
 *     path: 'facturas',
 *     canActivate: [authGuard, planGuard('facturas')],
 *     ...
 *   }
 *
 * Si el plan no tiene la feature, redirige a /planes con
 * query param ?feature=facturas para mostrar la página de upgrade.
 */
export const planGuard = (feature: PlanFeature): CanActivateFn => {
  return () => {
    const planService = inject(PlanService);
    const router = inject(Router);

    if (planService.canAccess(feature)) {
      return true;
    }

    router.navigate(['/planes'], { queryParams: { feature } });
    return false;
  };
};
