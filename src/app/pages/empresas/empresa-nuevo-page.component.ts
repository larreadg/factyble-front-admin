import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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
  EmpresaCreateEstablecimiento,
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

/** Catálogos de distrito/ciudad propios de cada establecimiento (dependen de su departamento/distrito). */
interface GeografiaEstablecimiento {
  distritoOptions: WritableSignal<GeografiaOption[]>;
  ciudadOptions: WritableSignal<GeografiaOption[]>;
  loadingDistritos: WritableSignal<boolean>;
  loadingCiudades: WritableSignal<boolean>;
}

/**
 * Rechaza códigos repetidos entre los controles de un FormArray: establecimientos dentro de la
 * empresa, o cajas dentro de un establecimiento. Dos puntos de expedición con el mismo
 * establecimiento-caja colisionan en numeración y CDC (el backend lo valida igual).
 */
const codigosUnicosValidator = (control: AbstractControl): ValidationErrors | null => {
  const codigos = (control as FormArray).controls.map((item) => item.get('codigo')?.value as string);
  const repetidos = codigos.filter((codigo, index) => codigo && codigos.indexOf(codigo) !== index);
  return repetidos.length > 0 ? { codigosRepetidos: [...new Set(repetidos)] } : null;
};

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
  protected readonly loadingDepartamentos = signal(false);
  private readonly geografiaPorEstablecimiento = new WeakMap<FormGroup, GeografiaEstablecimiento>();

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

  protected readonly establecimientos = this.formBuilder.array<FormGroup>(
    [this.crearEstablecimiento('001', 'Casa Matriz')],
    { validators: [Validators.minLength(1), codigosUnicosValidator] },
  );

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

  protected cajasDe(establecimiento: FormGroup): FormArray<FormGroup> {
    return establecimiento.get('cajas') as FormArray<FormGroup>;
  }

  protected geografiaDe(establecimiento: FormGroup): GeografiaEstablecimiento {
    return this.geografiaPorEstablecimiento.get(establecimiento)!;
  }

  protected agregarEstablecimiento(): void {
    const codigo = this.siguienteCodigo(this.establecimientos);
    this.establecimientos.push(this.crearEstablecimiento(codigo, `Establecimiento ${codigo}`));
  }

  protected quitarEstablecimiento(index: number): void {
    if (this.establecimientos.length > 1) {
      this.establecimientos.removeAt(index);
    }
  }

  protected agregarCaja(establecimiento: FormGroup): void {
    const cajas = this.cajasDe(establecimiento);
    const codigo = this.siguienteCodigo(cajas);
    cajas.push(this.crearCaja(codigo, `Caja ${Number(codigo)}`));
  }

  protected quitarCaja(establecimiento: FormGroup, index: number): void {
    const cajas = this.cajasDe(establecimiento);

    if (cajas.length > 1) {
      cajas.removeAt(index);
    }
  }

  protected onDepartamentoChange(establecimiento: FormGroup, event: SelectChangeEvent): void {
    const geografia = this.geografiaDe(establecimiento);
    establecimiento.patchValue({ codDistrito: '', codCiudad: '' });
    geografia.distritoOptions.set([]);
    geografia.ciudadOptions.set([]);

    const codDepartamento = event.value as string;

    if (!codDepartamento) {
      return;
    }

    geografia.loadingDistritos.set(true);

    this.geografiaService
      .getDistritos(codDepartamento)
      .pipe(finalize(() => geografia.loadingDistritos.set(false)))
      .subscribe({
        next: (items) => geografia.distritoOptions.set(this.toOptions(items)),
        error: () => this.showCatalogError('distritos'),
      });
  }

  protected onDistritoChange(establecimiento: FormGroup, event: SelectChangeEvent): void {
    const geografia = this.geografiaDe(establecimiento);
    establecimiento.patchValue({ codCiudad: '' });
    geografia.ciudadOptions.set([]);

    const codDistrito = event.value as string;

    if (!codDistrito) {
      return;
    }

    geografia.loadingCiudades.set(true);

    this.geografiaService
      .getCiudades(codDistrito)
      .pipe(finalize(() => geografia.loadingCiudades.set(false)))
      .subscribe({
        next: (items) => geografia.ciudadOptions.set(this.toOptions(items)),
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

  protected controlHasError(form: 'empresa' | 'usuarioAdmin' | 'certificado', controlName: string): boolean {
    return this.isInvalidAndTouched(this.formForStep(form).get(controlName));
  }

  protected groupHasError(group: FormGroup, controlName: string): boolean {
    return this.isInvalidAndTouched(group.get(controlName));
  }

  protected codigosRepetidos(array: FormArray): string[] {
    return (array.errors?.['codigosRepetidos'] as string[] | undefined) ?? [];
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

  private formForStep(form: 'empresa' | 'usuarioAdmin' | 'certificado'): FormGroup<any> {
    switch (form) {
      case 'empresa':
        return this.empresaForm;
      case 'usuarioAdmin':
        return this.usuarioAdminForm;
      case 'certificado':
        return this.certificadoForm;
    }
  }

  private crearEstablecimiento(codigo: string, nombre: string): FormGroup {
    const establecimiento = this.formBuilder.group({
      nombre: [nombre, Validators.required],
      direccion: ['', Validators.required],
      numeroCasa: [''],
      telefono: [''],
      codigo: [codigo, [Validators.required, Validators.pattern(/^\d{3}$/)]],
      codDistrito: ['', Validators.required],
      codCiudad: ['', Validators.required],
      codDepartamento: ['', Validators.required],
      cajas: this.formBuilder.array<FormGroup>([this.crearCaja('001', 'Caja 1')], {
        validators: [Validators.minLength(1), codigosUnicosValidator],
      }),
    });

    this.geografiaPorEstablecimiento.set(establecimiento, {
      distritoOptions: signal<GeografiaOption[]>([]),
      ciudadOptions: signal<GeografiaOption[]>([]),
      loadingDistritos: signal(false),
      loadingCiudades: signal(false),
    });

    return establecimiento;
  }

  private crearCaja(codigo: string, nombre: string): FormGroup {
    return this.formBuilder.group({
      nombre: [nombre, Validators.required],
      codigo: [codigo, [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });
  }

  /** Próximo código de 3 dígitos: el mayor ya cargado + 1. */
  private siguienteCodigo(array: FormArray): string {
    const maximo = array.controls
      .map((item) => Number(item.get('codigo')?.value))
      .filter((valor) => Number.isInteger(valor))
      .reduce((max, valor) => Math.max(max, valor), 0);

    return String(Math.min(maximo + 1, 999)).padStart(3, '0');
  }

  private isInvalidAndTouched(control: AbstractControl | null): boolean {
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  private validateStep(step: number): boolean {
    const groups: AbstractControl[] =
      step === 1
        ? [this.empresaForm]
        : step === 2
          ? [this.establecimientos]
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
      establecimientos: this.establecimientos.controls.map((control) => this.buildEstablecimiento(control)),
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

  private buildEstablecimiento(control: FormGroup): EmpresaCreateEstablecimiento {
    const establecimiento = control.getRawValue();
    const cajas = establecimiento.cajas as Array<{ nombre: string | null; codigo: string | null }>;

    return {
      nombre: establecimiento.nombre ?? '',
      direccion: establecimiento.direccion ?? '',
      ...(establecimiento.numeroCasa ? { numeroCasa: establecimiento.numeroCasa } : {}),
      ...(establecimiento.telefono ? { telefono: establecimiento.telefono } : {}),
      codigo: establecimiento.codigo ?? '',
      codDistrito: establecimiento.codDistrito ?? '',
      codCiudad: establecimiento.codCiudad ?? '',
      codDepartamento: establecimiento.codDepartamento ?? '',
      cajas: cajas.map((caja) => ({
        nombre: caja.nombre ?? '',
        codigo: caja.codigo ?? '',
      })),
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
