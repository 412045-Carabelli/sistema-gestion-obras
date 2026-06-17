import { Directive, HostListener, Input } from '@angular/core';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';

@Directive({
  selector: '[appBackButton]',
  standalone: true
})
export class BackButtonDirective {

  @Input() fallback: string = '/';

  constructor(private navHistory: NavigationHistoryService) {}

  @HostListener('click')
  onClick(): void {
    this.navHistory.back(this.fallback);
  }
}
