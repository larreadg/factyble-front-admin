import { Component, inject, input } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActividadEconomica } from '../../core/empresas/empresa.types';

// Topes del Manual Técnico v150 (los mismos que valida el back): gActEco 1-9, cActEco A 1-8,
// dDesActEco A 1-300.
export const ACTIVIDADES_ECONOMICAS_MAX = 9;
export const CODIGO_ACTIVIDAD_MAX = 8;
export const DESCRIPCION_ACTIVIDAD_MAX = 300;

/**
 * Clave de comparación de códigos: sin espacios de borde, mayúsculas ni acentos. Es la misma que usa el
 * back (`claveCodigoActividad`), que a su vez replica cómo compara la columna: "a1" y "A1" son el mismo.
 */
const claveCodigo = (codigo: unknown): string =>
  String(codigo ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Rechaza dos actividades con el mismo código (el back también lo valida). */
const actividadesUnicasValidator = (control: AbstractControl): ValidationErrors | null => {
  const codigos = (control as FormArray).controls.map((item) => String(item.get('codigo')?.value ?? '').trim());
  const claves = codigos.map(claveCodigo);
  const repetidos = codigos.filter((codigo, index) => codigo && claves.indexOf(claves[index]) !== index);
  return repetidos.length > 0 ? { actividadesRepetidas: [...new Set(repetidos)] } : null;
};

/** Obligatorio sin contar los espacios de los bordes (el back hace trim antes de medir). */
const noVacioValidator = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim().length > 0 ? null : { required: true };

export const crearActividadEconomica = (
  formBuilder: FormBuilder,
  actividad?: Partial<ActividadEconomica>,
): FormGroup =>
  formBuilder.group({
    codigo: [actividad?.codigo ?? '', [noVacioValidator, Validators.maxLength(CODIGO_ACTIVIDAD_MAX)]],
    descripcion: [actividad?.descripcion ?? '', [noVacioValidator, Validators.maxLength(DESCRIPCION_ACTIVIDAD_MAX)]],
  });

/** FormArray de actividades: arranca con las dadas o, si no hay, con una fila vacía (la principal). */
export const crearActividadesEconomicas = (
  formBuilder: FormBuilder,
  actividades: ActividadEconomica[] = [],
): FormArray<FormGroup> =>
  formBuilder.array<FormGroup>(
    (actividades.length > 0 ? actividades : [undefined]).map((actividad) =>
      crearActividadEconomica(formBuilder, actividad),
    ),
    {
      validators: [
        Validators.minLength(1),
        Validators.maxLength(ACTIVIDADES_ECONOMICAS_MAX),
        actividadesUnicasValidator,
      ],
    },
  );

/** Reemplaza las filas por las de la empresa cargada, sin marcar el formulario como modificado. */
export const cargarActividadesEconomicas = (
  formBuilder: FormBuilder,
  array: FormArray<FormGroup>,
  actividades: ActividadEconomica[],
): void => {
  array.clear({ emitEvent: false });
  for (const actividad of actividades.length > 0 ? actividades : [undefined]) {
    array.push(crearActividadEconomica(formBuilder, actividad), { emitEvent: false });
  }
  array.updateValueAndValidity();
  array.markAsPristine();
};

/** Lo que viaja al back: en el orden de la pantalla (la primera es la principal), sin espacios de borde. */
export const actividadesEconomicasPayload = (array: FormArray<FormGroup>): ActividadEconomica[] =>
  array.getRawValue().map((actividad: { codigo?: string | null; descripcion?: string | null }) => ({
    codigo: (actividad.codigo ?? '').trim(),
    descripcion: (actividad.descripcion ?? '').trim(),
  }));

/**
 * Lista editable de actividades económicas de la empresa (de 1 a 9). La primera es la principal:
 * todas van en el XML (gActEco) y en el encabezado del KuDE, una por renglón, en este orden.
 */
@Component({
  selector: 'app-actividades-economicas-field',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="flex flex-column gap-2">
      <span class="font-semibold">Actividades económicas</span>
      <small class="text-color-secondary">
        De 1 a {{ max }}. La primera es la principal. Todas se informan a SIFEN y se imprimen en el KuDE, en este orden.
      </small>

      @for (actividad of actividades().controls; track actividad; let index = $index) {
        <div [formGroup]="actividad" class="grid align-items-start">
          <div class="col-4 md:col-2 flex flex-column gap-2">
            <label [for]="'actividadCodigo' + index" class="font-semibold">Código</label>
            <input pInputText [id]="'actividadCodigo' + index" formControlName="codigo" class="w-full" />
            @if (tieneError(actividad, 'codigo')) {
              <small class="text-red-500">Obligatorio, hasta {{ codigoMax }} caracteres.</small>
            }
          </div>

          <div class="col-8 md:col-9 flex flex-column gap-2">
            <label [for]="'actividadDescripcion' + index" class="font-semibold">
              Descripción
              @if (index === 0) {
                <span class="text-color-secondary font-normal">(principal)</span>
              }
            </label>
            <input pInputText [id]="'actividadDescripcion' + index" formControlName="descripcion" class="w-full" />
            @if (tieneError(actividad, 'descripcion')) {
              <small class="text-red-500">Obligatoria, hasta {{ descripcionMax }} caracteres.</small>
            }
          </div>

          @if (actividades().length > 1) {
            <div class="col-12 md:col-1 flex align-items-end" style="min-height: 4.5rem">
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                ariaLabel="Quitar actividad"
                (click)="quitar(index)"
              />
            </div>
          }
        </div>
      }

      @if (repetidas().length > 0) {
        <small class="text-red-500">Actividad repetida: {{ repetidas().join(', ') }}.</small>
      }

      @if (actividades().length < max) {
        <div>
          <p-button
            label="Agregar actividad"
            icon="pi pi-plus"
            severity="secondary"
            [outlined]="true"
            size="small"
            (click)="agregar()"
          />
        </div>
      }
    </div>
  `,
})
export class ActividadesEconomicasFieldComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly actividades = input.required<FormArray<FormGroup>>();

  protected readonly max = ACTIVIDADES_ECONOMICAS_MAX;
  protected readonly codigoMax = CODIGO_ACTIVIDAD_MAX;
  protected readonly descripcionMax = DESCRIPCION_ACTIVIDAD_MAX;

  // Agregar o quitar una fila no pasa por un input, así que no marca el array como modificado: se
  // marca a mano, porque la pantalla de edición solo manda lo que cambió.
  protected agregar(): void {
    const actividades = this.actividades();
    if (actividades.length < ACTIVIDADES_ECONOMICAS_MAX) {
      actividades.push(crearActividadEconomica(this.formBuilder));
      actividades.markAsDirty();
    }
  }

  protected quitar(index: number): void {
    const actividades = this.actividades();
    if (actividades.length > 1) {
      actividades.removeAt(index);
      actividades.markAsDirty();
    }
  }

  protected tieneError(grupo: FormGroup, campo: string): boolean {
    const control = grupo.get(campo);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  protected repetidas(): string[] {
    return (this.actividades().errors?.['actividadesRepetidas'] as string[] | undefined) ?? [];
  }
}
