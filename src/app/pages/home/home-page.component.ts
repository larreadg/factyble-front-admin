import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  private readonly authService = inject(AuthService);

  protected readonly userEmail = this.authService.getCurrentUser()?.email ?? 'usuario';
}
