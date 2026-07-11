import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { EmpresaService } from '../../core/empresas/empresa.service';
import {
  EmpresaUpdatePayload,
  EmpresaValidationError,
  TipoContribuyente,
  TipoImpuesto,
} from '../../core/empresas/empresa.types';

@Component({
  selector: 'app-empresa-editar-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    FileUploadModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './empresa-editar-page.component.html',
})
export class EmpresaEditarPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly messageService = inject(MessageService);

  private readonly empresaId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly empresaNombre = signal('');
  protected readonly logoFile = signal<File | null>(null);
  protected readonly certificadoFile = signal<File | null>(null);
  protected readonly certificadoActivoAlias = signal<string | null>(null);

  protected readonly tipoContribuyenteOptions: Array<{ label: string; value: TipoContribuyente }> = [
    { label: 'Física', value: 'FISICA' },
    { label: 'Jurídica', value: 'JURIDICA' },
  ];

  protected readonly tipoImpuestoOptions: Array<{ label: string; value: TipoImpuesto }> = [
    { label: 'IVA', value: 'IVA' },
    { label: 'ISC', value: 'ISC' },
    { label: 'Renta', value: 'RENTA' },
    { label: 'Ninguno', value: 'NINGUNO' },
    { label: 'IVA + Renta', value: 'IVA_RENTA' },
  ];

  protected readonly empresaForm = this.formBuilder.group({
    ruc: [''],
    rucSinDv: ['', Validators.pattern(/^\d{1,8}$/)],
    digitoVerificador: ['', Validators.pattern(/^\d$/)],
    nombreEmpresa: [''],
    timbrado: [''],
    direccion: [''],
    vigenteDesde: [null as Date | null],
    telefono: [''],
    email: ['', Validators.email],
    ciudad: [''],
    tipoContribuyente: ['' as TipoContribuyente | ''],
    tipoImpuesto: ['' as TipoImpuesto | ''],
    codActividadPrincipal: [''],
    descActividadPrincipal: [''],
    codActividadSecundaria: [''],
    descActividadSecundaria: [''],
    codMoneda: ['', [Validators.minLength(3), Validators.maxLength(3)]],
    descMoneda: [''],
    csc: [''],
    cscId: [''],
  });

  protected readonly certificadoRenewForm = this.formBuilder.group({
    alias: [''],
    clave: [''],
  });

  ngOnInit(): void {
    if (!this.empresaId || Number.isNaN(this.empresaId)) {
      void this.router.navigate(['/empresas']);
      return;
    }

    this.empresaService.getEmpresaById(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresaNombre.set(empresa.nombre_empresa);
        this.empresaForm.patchValue({
          ruc: empresa.ruc,
          rucSinDv: empresa.ruc_sin_dv,
          digitoVerificador: empresa.digito_verificador,
          nombreEmpresa: empresa.nombre_empresa,
          timbrado: empresa.timbrado,
          direccion: empresa.direccion,
          vigenteDesde: empresa.vigente_desde ? this.parseDateOnly(empresa.vigente_desde) : null,
          telefono: empresa.telefono,
          email: empresa.email,
          ciudad: empresa.ciudad,
          tipoContribuyente: empresa.tipo_contribuyente as TipoContribuyente,
          tipoImpuesto: empresa.tipo_impuesto as TipoImpuesto,
          codActividadPrincipal: empresa.cod_actividad_principal,
          descActividadPrincipal: empresa.desc_actividad_principal,
          codActividadSecundaria: empresa.cod_actividad_secundaria ?? '',
          descActividadSecundaria: empresa.desc_actividad_secundaria ?? '',
          codMoneda: empresa.cod_moneda,
          descMoneda: empresa.desc_moneda ?? '',
          cscId: empresa.csc_id,
        });
        const certificadoActivo = empresa.certificados.find((certificado) => certificado.activo);
        this.certificadoActivoAlias.set(certificadoActivo?.alias ?? null);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar la empresa',
          detail: error.error?.message ?? 'Intenta nuevamente.',
        });
        void this.router.navigate(['/empresas']);
      },
    });
  }

  protected controlHasError(controlName: string): boolean {
    const control = this.empresaForm.get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  protected onLogoSelect(event: FileSelectEvent): void {
    this.logoFile.set(event.files[0] ?? null);
  }

  protected onLogoClear(): void {
    this.logoFile.set(null);
  }

  protected onCertificadoSelect(event: FileSelectEvent): void {
    this.certificadoFile.set(event.files[0] ?? null);
  }

  protected onCertificadoClear(): void {
    this.certificadoFile.set(null);
  }

  protected submit(): void {
    this.empresaForm.markAllAsTouched();

    if (this.empresaForm.invalid) {
      return;
    }

    const { alias, clave } = this.certificadoRenewForm.getRawValue();
    const renewFieldsProvided = [alias, clave, this.certificadoFile()].filter(Boolean).length;

    if (renewFieldsProvided > 0 && renewFieldsProvided < 3) {
      this.certificadoRenewForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Certificado incompleto',
        detail: 'Para renovar el certificado completa el alias, la contraseña y el archivo .p12/.pfx.',
      });
      return;
    }

    const payload = this.buildPayload();
    const logoFile = this.logoFile();
    const certificadoFile = renewFieldsProvided === 3 ? (this.certificadoFile() ?? undefined) : undefined;

    if (Object.keys(payload).length === 0 && !logoFile && !certificadoFile) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No hay cambios para guardar.',
      });
      return;
    }

    this.saving.set(true);

    this.empresaService
      .updateEmpresa(this.empresaId, payload, { logo: logoFile ?? undefined, certificado: certificadoFile })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (empresa) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Empresa actualizada',
            detail: `${empresa.nombre_empresa} se actualizó correctamente.`,
          });
          void this.router.navigate(['/empresas']);
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo actualizar la empresa',
            detail: this.extractErrorMessage(error),
          });
        },
      });
  }

  private buildPayload(): EmpresaUpdatePayload {
    const raw = this.empresaForm.getRawValue();
    const controls = this.empresaForm.controls;
    const payload: EmpresaUpdatePayload = {};

    if (controls.ruc.dirty) {
      payload.ruc = raw.ruc ?? '';
    }
    if (controls.rucSinDv.dirty) {
      payload.rucSinDv = raw.rucSinDv ?? '';
    }
    if (controls.digitoVerificador.dirty) {
      payload.digitoVerificador = raw.digitoVerificador ?? '';
    }
    if (controls.nombreEmpresa.dirty) {
      payload.nombreEmpresa = raw.nombreEmpresa ?? '';
    }
    if (controls.timbrado.dirty) {
      payload.timbrado = raw.timbrado ?? '';
    }
    if (controls.direccion.dirty) {
      payload.direccion = raw.direccion ?? '';
    }
    if (controls.vigenteDesde.dirty) {
      payload.vigenteDesde = this.toIsoDate(raw.vigenteDesde);
    }
    if (controls.telefono.dirty) {
      payload.telefono = raw.telefono ?? '';
    }
    if (controls.email.dirty) {
      payload.email = raw.email ?? '';
    }
    if (controls.ciudad.dirty) {
      payload.ciudad = raw.ciudad ?? '';
    }
    if (controls.tipoContribuyente.dirty && raw.tipoContribuyente) {
      payload.tipoContribuyente = raw.tipoContribuyente as TipoContribuyente;
    }
    if (controls.tipoImpuesto.dirty && raw.tipoImpuesto) {
      payload.tipoImpuesto = raw.tipoImpuesto as TipoImpuesto;
    }
    if (controls.codActividadPrincipal.dirty) {
      payload.codActividadPrincipal = raw.codActividadPrincipal ?? '';
    }
    if (controls.descActividadPrincipal.dirty) {
      payload.descActividadPrincipal = raw.descActividadPrincipal ?? '';
    }
    if (controls.codActividadSecundaria.dirty) {
      payload.codActividadSecundaria = raw.codActividadSecundaria || null;
    }
    if (controls.descActividadSecundaria.dirty) {
      payload.descActividadSecundaria = raw.descActividadSecundaria || null;
    }
    if (controls.codMoneda.dirty) {
      payload.codMoneda = raw.codMoneda ?? '';
    }
    if (controls.descMoneda.dirty) {
      payload.descMoneda = raw.descMoneda || null;
    }
    if (controls.cscId.dirty) {
      payload.cscId = raw.cscId ?? '';
    }

    if (raw.csc) {
      payload.csc = raw.csc;
    }

    const { alias, clave } = this.certificadoRenewForm.getRawValue();

    if (alias && clave && this.certificadoFile()) {
      payload.certificado = { alias, clave };
    }

    return payload;
  }

  private parseDateOnly(iso: string): Date {
    const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(date: Date | null | undefined): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const data = error.error?.data;

    if (Array.isArray(data) && data.length > 0) {
      return (data as EmpresaValidationError[]).map((item) => item.msg).join(' ');
    }

    return error.error?.message ?? 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
