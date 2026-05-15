import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {

  private history: string[] = [];
  private maxSize = 20;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const lastUrl = this.history[this.history.length - 1];
        if (lastUrl !== event.urlAfterRedirects) {
          this.history.push(event.urlAfterRedirects);
          console.log('📌 NavEnd:', event.urlAfterRedirects, '| History:', this.history);
          if (this.history.length > this.maxSize) {
            this.history.shift();
          }
        }
      });
  }

  getPreviousUrl(): string | null {
    if (this.history.length < 2) return null;
    return this.history[this.history.length - 2];
  }

  back(fallback: string = '/'): void {
    const previous = this.getPreviousUrl();
    console.log('🔙 BACK() CALLED | History:', this.history, '| Previous:', previous, '| Fallback:', fallback);
    if (previous) {
      this.history.pop();
      this.history.pop();
      this.router.navigateByUrl(previous);
    } else {
      this.router.navigateByUrl(fallback);
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getHistory(): string[] {
    return [...this.history];
  }
}
