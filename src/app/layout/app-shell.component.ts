import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AvatarModule,
    BadgeModule,
    ButtonModule,
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  protected readonly authService = inject(AuthService);
  protected readonly appName = environment.appName;
  protected readonly appVersion = environment.appVersion;
  protected readonly currentUserEmail = this.authService.getCurrentUser()?.email ?? 'usuario';
  protected readonly currentDocumento = this.authService.getCurrentUser()?.documento ?? '';
  protected readonly menuItems = [
    {
      icon: 'pi pi-home',
      label: 'Inicio',
      route: '/inicio',
    },
    {
      icon: 'pi pi-building',
      label: 'Empresas',
      route: '/empresas',
    },
  ];

  protected logout(): void {
    this.authService.logout();
  }
}
