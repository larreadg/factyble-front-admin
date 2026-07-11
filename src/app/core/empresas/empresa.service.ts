import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../auth/auth.types';
import {
  EmpresaCreatePayload,
  EmpresaDetail,
  EmpresaPaginatedResponse,
  EmpresaUpdatePayload,
} from './empresa.types';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);

  getEmpresas(params: { page?: number; itemsPerPage?: number; filter?: string } = {}): Observable<EmpresaPaginatedResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.itemsPerPage) {
      httpParams = httpParams.set('itemsPerPage', params.itemsPerPage.toString());
    }
    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }

    return this.http
      .get<ApiResponse<EmpresaPaginatedResponse>>(`${environment.apiUrl}/empresa`, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  createEmpresa(payload: EmpresaCreatePayload, certificadoFile: File, logoFile: File): Observable<EmpresaDetail> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    formData.append('certificado', certificadoFile);
    formData.append('logo', logoFile);

    return this.http
      .post<ApiResponse<EmpresaDetail>>(`${environment.apiUrl}/empresa`, formData)
      .pipe(map((response) => response.data));
  }

  getEmpresaById(id: number): Observable<EmpresaDetail> {
    return this.http
      .get<ApiResponse<EmpresaDetail>>(`${environment.apiUrl}/empresa/${id}`)
      .pipe(map((response) => response.data));
  }

  updateEmpresa(
    id: number,
    payload: EmpresaUpdatePayload,
    files: { logo?: File; certificado?: File } = {},
  ): Observable<EmpresaDetail> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (files.logo) {
      formData.append('logo', files.logo);
    }
    if (files.certificado) {
      formData.append('certificado', files.certificado);
    }

    return this.http
      .put<ApiResponse<EmpresaDetail>>(`${environment.apiUrl}/empresa/${id}`, formData)
      .pipe(map((response) => response.data));
  }
}
