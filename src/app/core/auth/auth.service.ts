import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthUser, JwtPayload, LoginPayload, LoginResponseData } from './auth.types';

const TOKEN_KEY = 'factyble.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${environment.apiUrl}/usuario/authenticate`, payload)
      .pipe(
        map((response) => response.data.token),
        tap((token) => localStorage.setItem(TOKEN_KEY, token)),
      );
  }

  getCaptcha(): Observable<string> {
    return this.http.get(`${environment.apiUrl}/captcha?t=${Date.now()}`, {
      responseType: 'text',
    });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const payload = this.getDecodedTokenPayload();
    const email = this.getEmailFromPayload(payload);
    const documento = this.getDocumentoFromPayload(payload);

    return email ? { email, documento } : null;
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    void this.router.navigate(['/login']);
  }

  private getDecodedTokenPayload(): JwtPayload | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length < 2) {
      return null;
    }

    try {
      const normalizedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
        '=',
      );
      const decodedPayload = atob(paddedPayload);

      return JSON.parse(decodedPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  private getEmailFromPayload(payload: JwtPayload | null): string | null {
    const email = payload?.usuario?.email ?? payload?.email;

    return typeof email === 'string' && email.trim().length > 0 ? email : null;
  }

  private getDocumentoFromPayload(payload: JwtPayload | null): string {
    const documento = payload?.['documento'] ?? payload?.usuario?.documento;

    return typeof documento === 'string' && documento.trim().length > 0 ? documento : '';
  }
}
