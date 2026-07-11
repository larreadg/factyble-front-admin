import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { EmpresaService } from '../../core/empresas/empresa.service';
import { Empresa } from '../../core/empresas/empresa.types';

@Component({
  selector: 'app-empresas-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './empresas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasPageComponent implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly cdr = inject(ChangeDetectorRef);

  empresas: Empresa[] = [];
  totalRecords = 0;
  rows = 10;
  loading = true;
  filterValue = '';

  ngOnInit() {
    this.loadEmpresas({ first: 0, rows: this.rows });
  }

  loadEmpresas(event: TableLazyLoadEvent) {
    this.loading = true;

    const page = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;

    this.empresaService
      .getEmpresas({
        page,
        itemsPerPage: event.rows ?? 10,
        filter: this.filterValue || undefined,
      })
      .subscribe({
        next: (data) => {
          this.empresas = data.items;
          this.totalRecords = data.totalItems;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue = value;
    this.loadEmpresas({ first: 0, rows: this.rows });
  }

  getCertificadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'VIGENTE':
        return 'success';
      case 'POR_VENCER':
        return 'warn';
      case 'VENCIDO':
      case 'REVOCADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
