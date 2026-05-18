import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { GruposModalService } from '../../services/grupos-obras/grupos-modal.service';
import { LayoutHeaderComponent } from '../../shared/layout-header/layout-header.component';

@Component({
  selector: 'app-grupos-layout',
  templateUrl: './grupos-layout.component.html',
  styleUrls: ['./grupos-layout.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    LayoutHeaderComponent
  ],
  providers: [MessageService, ConfirmationService]
})
export class GruposLayoutComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    private router: Router,
    private gruposModalService: GruposModalService
  ) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
  }

  openNewGrupo(): void {
    this.gruposModalService.abrirModal();
  }

  goBack(): void {
    this.router.navigate(['/grupos']);
  }
}
