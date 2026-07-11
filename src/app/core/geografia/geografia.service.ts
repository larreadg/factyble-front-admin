import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../auth/auth.types';
import { GeografiaItem } from './geografia.types';

@Injectable({ providedIn: 'root' })
export class GeografiaService {
  private readonly http = inject(HttpClient);

  getDepartamentos(): Observable<GeografiaItem[]> {
    return this.http
      .get<ApiResponse<GeografiaItem[]>>(`${environment.apiUrl}/geografia/departamentos`)
      .pipe(map((response) => response.data));
  }

  getDistritos(codDepartamento?: string): Observable<GeografiaItem[]> {
    let params = new HttpParams();

    if (codDepartamento) {
      params = params.set('cod_departamento', codDepartamento);
    }

    return this.http
      .get<ApiResponse<GeografiaItem[]>>(`${environment.apiUrl}/geografia/distritos`, { params })
      .pipe(map((response) => response.data));
  }

  getCiudades(codDistrito?: string): Observable<GeografiaItem[]> {
    let params = new HttpParams();

    if (codDistrito) {
      params = params.set('cod_distrito', codDistrito);
    }

    return this.http
      .get<ApiResponse<GeografiaItem[]>>(`${environment.apiUrl}/geografia/ciudades`, { params })
      .pipe(map((response) => response.data));
  }
}
