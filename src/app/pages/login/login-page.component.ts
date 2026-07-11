import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  protected readonly appName = environment.appName;
  protected readonly loading = signal(false);
  protected readonly captchaLoading = signal(false);
  protected readonly captchaSvg = signal<SafeHtml | null>(null);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly supportText =
    'Usa tu cuenta corporativa para ingresar al panel administrativo.';
  protected readonly submitLabel = computed(() =>
    this.loading() ? 'Autenticando...' : 'Ingresar al panel',
  );

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    usuario: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    captcha: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.refreshCaptcha();
  }

  protected refreshCaptcha(): void {
    this.captchaLoading.set(true);
    this.captchaSvg.set(null);

    this.authService
      .getCaptcha()
      .pipe(finalize(() => this.captchaLoading.set(false)))
      .subscribe({
        next: (svg) => {
          this.captchaSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
        },
        error: () => {
          this.showToast('error', 'Captcha no disponible', 'No se pudo cargar la captcha.');
        },
      });
  }

  protected submit(): void {
    if (this.loginForm.invalid || this.loading()) {
      this.loginForm.markAllAsTouched();

      if (!this.loading()) {
        this.showToast(
          'warn',
          'Revisa los datos',
          'Completa el correo, la contrasena y el captcha antes de continuar.',
        );
      }

      return;
    }

    this.loading.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/inicio']);
        },
        error: (error: HttpErrorResponse) => {
          this.showToast(
            'error',
            'No fue posible iniciar sesion',
            error.error?.message ?? 'Verifica tus credenciales e intenta nuevamente.',
          );
          this.loginForm.controls.captcha.setValue('');
          this.refreshCaptcha();
        },
      });
  }

  protected controlHasError(controlName: 'usuario' | 'password' | 'captcha'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private showToast(severity: 'error' | 'warn', summary: string, detail: string): void {
    this.messageService.add({
      severity,
      summary,
      detail,
      life: 4000,
    });
  }
}
