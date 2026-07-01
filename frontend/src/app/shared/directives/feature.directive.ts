import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect
} from '@angular/core';
import { PlanService } from '../../services/plan/plan.service';
import { PlanFeature } from '../../core/models/models';

/**
 * Directiva estructural que muestra/oculta elementos según el plan.
 *
 * Uso:
 *   <div *appFeature="'facturas'">Contenido solo para planes con facturas</div>
 *   <div *appFeature="'grupos_obras'; else upgradeMsg">...</div>
 *
 * El elemento se elimina del DOM (no solo oculto con display:none).
 */
@Directive({
  selector: '[appFeature]',
  standalone: true
})
export class FeatureDirective implements OnInit {

  @Input('appFeature') feature!: PlanFeature;
  @Input('appFeatureElse') elseTemplate?: TemplateRef<any>;

  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private planService = inject(PlanService);

  private hasView = false;

  ngOnInit(): void {
    this.updateView();

    // Reactivo: si el plan cambia (ej: upgrade sin relogin), actualiza el DOM
    effect(() => {
      // Acceder al signal para registrar dependencia reactiva
      this.planService.planConfig();
      this.updateView();
    });
  }

  private updateView(): void {
    const canAccess = this.planService.canAccess(this.feature);

    if (canAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!canAccess && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    } else if (!canAccess && !this.hasView && this.elseTemplate) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }
}
