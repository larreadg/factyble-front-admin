import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ToastModule } from 'primeng/toast';
import { EmpresaService } from '../../core/empresas/empresa.service';
import {
  EmpresaCreatePayload,
  EmpresaValidationError,
  TipoContribuyente,
  TipoImpuesto,
} from '../../core/empresas/empresa.types';
import { GeografiaService } from '../../core/geografia/geografia.service';
import { GeografiaItem } from '../../core/geografia/geografia.types';

interface GeografiaOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-empresa-nuevo-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    FileUploadModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    StepperModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './empresa-nuevo-page.component.html',
})
export class EmpresaNuevoPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly geografiaService = inject(GeografiaService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly activeStep = signal(1);
  protected readonly saving = signal(false);
  protected readonly certificadoFile = signal<File | null>(null);
  protected readonly logoFile = signal<File | null>(null);

  protected readonly departamentoOptions = signal<GeografiaOption[]>([]);
  protected readonly distritoOptions = signal<GeografiaOption[]>([]);
  protected readonly ciudadOptions = signal<GeografiaOption[]>([]);
  protected readonly loadingDepartamentos = signal(false);
  protected readonly loadingDistritos = signal(false);
  protected readonly loadingCiudades = signal(false);

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
    ruc: ['', Validators.required],
    rucSinDv: ['', [Validators.required, Validators.pattern(/^\d{1,8}$/)]],
    digitoVerificador: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    nombreEmpresa: ['', Validators.required],
    timbrado: ['', Validators.required],
    direccion: ['', Validators.required],
    vigenteDesde: [null as Date | null, Validators.required],
    telefono: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    ciudad: ['', Validators.required],
    tipoContribuyente: ['JURIDICA' as TipoContribuyente, Validators.required],
    tipoImpuesto: ['IVA' as TipoImpuesto, Validators.required],
    codActividadPrincipal: ['', Validators.required],
    descActividadPrincipal: ['', Validators.required],
    codActividadSecundaria: [''],
    descActividadSecundaria: [''],
    codMoneda: ['PYG'],
    csc: ['', Validators.required],
    cscId: ['', Validators.required],
  });

  protected readonly establecimientoForm = this.formBuilder.group({
    nombre: ['Casa Matriz', Validators.required],
    direccion: ['', Validators.required],
    numeroCasa: [''],
    telefono: [''],
    codigo: ['001', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    codDistrito: ['', Validators.required],
    codCiudad: ['', Validators.required],
    codDepartamento: ['', Validators.required],
  });

  protected readonly cajaForm = this.formBuilder.group({
    nombre: ['Caja 1', Validators.required],
    codigo: ['001', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  protected readonly usuarioAdminForm = this.formBuilder.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    documento: ['', Validators.required],
    telefono: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly certificadoForm = this.formBuilder.group({
    alias: ['', Validators.required],
    clave: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadingDepartamentos.set(true);

    this.geografiaService
      .getDepartamentos()
      .pipe(finalize(() => this.loadingDepartamentos.set(false)))
      .subscribe({
        next: (items) => this.departamentoOptions.set(this.toOptions(items)),
        error: () => this.showCatalogError('departamentos'),
      });
  }

  protected onDepartamentoChange(event: SelectChangeEvent): void {
    this.establecimientoForm.patchValue({ codDistrito: '', codCiudad: '' });
    this.distritoOptions.set([]);
    this.ciudadOptions.set([]);

    const codDepartamento = event.value as string;

    if (!codDepartamento) {
      return;
    }

    this.loadingDistritos.set(true);

    this.geografiaService
      .getDistritos(codDepartamento)
      .pipe(finalize(() => this.loadingDistritos.set(false)))
      .subscribe({
        next: (items) => this.distritoOptions.set(this.toOptions(items)),
        error: () => this.showCatalogError('distritos'),
      });
  }

  protected onDistritoChange(event: SelectChangeEvent): void {
    this.establecimientoForm.patchValue({ codCiudad: '' });
    this.ciudadOptions.set([]);

    const codDistrito = event.value as string;

    if (!codDistrito) {
      return;
    }

    this.loadingCiudades.set(true);

    this.geografiaService
      .getCiudades(codDistrito)
      .pipe(finalize(() => this.loadingCiudades.set(false)))
      .subscribe({
        next: (items) => this.ciudadOptions.set(this.toOptions(items)),
        error: () => this.showCatalogError('ciudades'),
      });
  }

  protected onCertificadoSelect(event: FileSelectEvent): void {
    this.certificadoFile.set(event.files[0] ?? null);
  }

  protected onCertificadoClear(): void {
    this.certificadoFile.set(null);
  }

  protected onLogoSelect(event: FileSelectEvent): void {
    this.logoFile.set(event.files[0] ?? null);
  }

  protected onLogoClear(): void {
    this.logoFile.set(null);
  }

  protected controlHasError(
    form: 'empresa' | 'establecimiento' | 'caja' | 'usuarioAdmin' | 'certificado',
    controlName: string,
  ): boolean {
    const control = this.formForStep(form).get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  protected goToStep(step: number, currentStep: number, activateCallback: (value: number) => void): void {
    if (step > currentStep) {
      if (!this.validateStep(currentStep)) {
        return;
      }

      if (currentStep === 1 && !this.logoFile()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Falta el logo',
          detail: 'Selecciona el archivo del logo (.png, .jpg o .jpeg) antes de continuar.',
        });
        return;
      }
    }

    activateCallback(step);
  }

  protected submit(): void {
    if (!this.validateStep(4)) {
      return;
    }

    if (!this.certificadoFile()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta el certificado',
        detail: 'Selecciona el archivo .p12 o .pfx del certificado antes de continuar.',
      });
      return;
    }

    this.saving.set(true);

    const payload = this.buildPayload();

    this.empresaService
      .createEmpresa(payload, this.certificadoFile()!, this.logoFile()!)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (empresa) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Empresa creada',
            detail: `${empresa.nombre_empresa} se registró correctamente.`,
          });
          void this.router.navigate(['/empresas']);
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo crear la empresa',
            detail: this.extractErrorMessage(error),
          });
        },
      });
  }

  private formForStep(
    form: 'empresa' | 'establecimiento' | 'caja' | 'usuarioAdmin' | 'certificado',
  ): FormGroup<any> {
    switch (form) {
      case 'empresa':
        return this.empresaForm;
      case 'establecimiento':
        return this.establecimientoForm;
      case 'caja':
        return this.cajaForm;
      case 'usuarioAdmin':
        return this.usuarioAdminForm;
      case 'certificado':
        return this.certificadoForm;
    }
  }

  private validateStep(step: number): boolean {
    const groups =
      step === 1
        ? [this.empresaForm]
        : step === 2
          ? [this.establecimientoForm, this.cajaForm]
          : step === 3
            ? [this.usuarioAdminForm]
            : [this.certificadoForm];

    let valid = true;

    for (const group of groups) {
      group.markAllAsTouched();

      if (group.invalid) {
        valid = false;
      }
    }

    return valid;
  }

  private buildPayload(): EmpresaCreatePayload {
    const empresa = this.empresaForm.getRawValue();
    const establecimiento = this.establecimientoForm.getRawValue();
    const caja = this.cajaForm.getRawValue();
    const usuarioAdmin = this.usuarioAdminForm.getRawValue();
    const certificado = this.certificadoForm.getRawValue();

    return {
      empresa: {
        ruc: empresa.ruc ?? '',
        rucSinDv: empresa.rucSinDv ?? '',
        digitoVerificador: empresa.digitoVerificador ?? '',
        nombreEmpresa: empresa.nombreEmpresa ?? '',
        timbrado: empresa.timbrado ?? '',
        direccion: empresa.direccion ?? '',
        vigenteDesde: this.toIsoDate(empresa.vigenteDesde),
        telefono: empresa.telefono ?? '',
        email: empresa.email ?? '',
        ciudad: empresa.ciudad ?? '',
        tipoContribuyente: (empresa.tipoContribuyente ?? 'JURIDICA') as TipoContribuyente,
        tipoImpuesto: (empresa.tipoImpuesto ?? 'IVA') as TipoImpuesto,
        codActividadPrincipal: empresa.codActividadPrincipal ?? '',
        descActividadPrincipal: empresa.descActividadPrincipal ?? '',
        ...(empresa.codActividadSecundaria
          ? { codActividadSecundaria: empresa.codActividadSecundaria }
          : {}),
        ...(empresa.descActividadSecundaria
          ? { descActividadSecundaria: empresa.descActividadSecundaria }
          : {}),
        codMoneda: empresa.codMoneda || 'PYG',
        csc: empresa.csc ?? '',
        cscId: empresa.cscId ?? '',
      },
      establecimientos: [
        {
          nombre: establecimiento.nombre ?? '',
          direccion: establecimiento.direccion ?? '',
          ...(establecimiento.numeroCasa ? { numeroCasa: establecimiento.numeroCasa } : {}),
          ...(establecimiento.telefono ? { telefono: establecimiento.telefono } : {}),
          codigo: establecimiento.codigo ?? '',
          codDistrito: establecimiento.codDistrito ?? '',
          codCiudad: establecimiento.codCiudad ?? '',
          codDepartamento: establecimiento.codDepartamento ?? '',
          cajas: [
            {
              nombre: caja.nombre ?? '',
              codigo: caja.codigo ?? '',
            },
          ],
        },
      ],
      usuarioAdmin: {
        nombres: usuarioAdmin.nombres ?? '',
        apellidos: usuarioAdmin.apellidos ?? '',
        email: usuarioAdmin.email ?? '',
        documento: usuarioAdmin.documento ?? '',
        telefono: usuarioAdmin.telefono ?? '',
        password: usuarioAdmin.password ?? '',
      },
      certificado: {
        alias: certificado.alias ?? '',
        clave: certificado.clave ?? '',
      },
    };
  }

  private toOptions(items: GeografiaItem[]): GeografiaOption[] {
    return items.map((item) => ({ label: `${item.descripcion} (${item.codigo})`, value: item.codigo }));
  }

  private showCatalogError(catalogo: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'No se pudo cargar el catálogo',
      detail: `No se pudieron obtener los ${catalogo}. Intenta nuevamente.`,
    });
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
