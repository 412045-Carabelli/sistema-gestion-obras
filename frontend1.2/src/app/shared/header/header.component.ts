import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    FormsModule,
    InputTextModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() sidebarOpen = false;
  @Output() toggleMenu = new EventEmitter<void>();

  private readonly storageKey = 'auditUserName';

  userNameInput = '';
  userName = '';

  onToggleMenu() {
    this.toggleMenu.emit();
  }

  constructor() {
    this.loadUserName();
  }

  get isLoggedIn(): boolean {
    return this.userName.trim().length > 0;
  }

  onLogin() {
    const trimmed = this.userNameInput.trim();
    if (!trimmed) {
      return;
    }
    this.userName = trimmed;
    this.userNameInput = trimmed;
    this.saveUserName(trimmed);
  }

  onLogout() {
    this.userName = '';
    this.userNameInput = '';
    this.clearUserName();
  }

  private loadUserName() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.userName = stored;
        this.userNameInput = stored;
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }

  private saveUserName(value: string) {
    try {
      localStorage.setItem(this.storageKey, value);
    } catch {
      // ignore storage errors
    }
  }

  private clearUserName() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore storage errors
    }
  }
}
