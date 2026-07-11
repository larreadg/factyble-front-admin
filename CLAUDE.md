# CLAUDE.md

Guía de arquitectura y estilo para trabajar en **factyble-front-admin**.

## Stack

- Angular 21 (standalone components, signals, control flow `@if`/`@for`).
- PrimeNG 21 como única librería de componentes UI.
- PrimeFlex 4 como única librería de utilidades de layout/spacing.
- PrimeIcons 7 para iconografía (`pi pi-*`).

## Tema

- Preset: **Aura** (`@primeuix/themes/aura`), definido en `src/app/app.theme.ts` vía `definePreset`.
- Esquema de color: **Light** únicamente. El modo oscuro está deshabilitado explícitamente (`darkModeSelector: 'none'` en `providePrimeNG`, `src/app/app.config.ts`). No reintroducir clases tipo `.app-dark`, `.p-dark` ni lógica de alternancia de tema sin acuerdo explícito.
- Color primario: **Rose** (paleta nativa de `@primeuix/themes`, referenciada como `{rose.50}` … `{rose.950}` en el `semantic.primary` del preset). No hardcodear hex de esta paleta; si se necesita ajustar un tono, se edita `app.theme.ts`.
- Cualquier color que se use en templates/estilos debe salir de los design tokens de PrimeNG (`var(--p-primary-*)`, `var(--p-surface-*)`, `var(--p-text-*)`, etc.) o de las clases de utilidad de PrimeFlex que ya envuelven esos tokens (`surface-card`, `surface-ground`, `surface-border`, `text-color`, `text-color-secondary`, `bg-primary`, etc.). Nunca un hex o `rgb()` suelto.

## Regla 1 — Layout: solo PrimeFlex

Todo el maquetado (posición, tamaño, alineación, espaciado, breakpoints) se resuelve con clases de utilidad de PrimeFlex directamente en el template:

- Grid: `grid`, `col-12`, `md:col-5`, `col-offset-*`.
- Flexbox: `flex`, `flex-column`, `align-items-center`, `justify-content-between`, `gap-3`.
- Espaciado: `p-*`, `m-*`, `px-*`, `py-*`.
- Responsive: prefijos `sm:`, `md:`, `lg:`, `xl:`.
- Tamaño: `w-full`, `w-*rem`, `min-h-screen`, `flex-1`.

**Prohibido:**
- Escribir `display: flex`, `display: grid`, `position`, `margin`, `padding`, media queries, etc. en un archivo `.scss`/`.css` de componente.
- Crear clases BEM propias (`.shell`, `.topbar`, `.card__header`, …) para resolver layout.
- Usar `[ngStyle]`/`style="..."` inline para spacing o alineación.

Si un componente nuevo "necesita" un archivo de estilos para posicionar cosas, es una señal de que falta una combinación de utilidades de PrimeFlex, no una excepción para escribir CSS.

## Regla 2 — Solo componentes PrimeNG, cero estilos propios

No se crean componentes visuales con CSS propio. Para cualquier elemento de interfaz se usa el componente PrimeNG correspondiente, configurado por *inputs* (severity, size, variant, icon, styleClass con clases de PrimeFlex/tokens) en vez de CSS a medida:

| Necesidad | Usar |
|---|---|
| Botón | `p-button` / `pButton` |
| Texto/campo de formulario | `p-inputtext` (`pInputText`), `p-password`, `p-select`, etc. |
| Etiqueta de estado | `p-tag` |
| Contador/insignia | `p-badge` |
| Avatar/iniciales de usuario | `p-avatar` |
| Tarjeta/contenedor con borde | `p-card`, `p-panel` |
| Tabla de datos | `p-table` |
| Menú/navegación | `p-menu`, `p-menubar`, `p-panelmenu`, `p-tabs` |
| Notificaciones | `p-toast` |
| Separador | `p-divider` |
| Campo con ícono | `p-iconfield` + `p-inputicon` |

**Prohibido:**
- `::ng-deep` para reescribir la apariencia interna de un componente PrimeNG (bordes, fondos, paddings).
- Reimplementar un botón, tag, badge, avatar, etc. con un `<div>`/`<span>` y CSS propio.
- Gradientes, `box-shadow`, `backdrop-filter`, `border-radius` a medida como decoración de marca. La apariencia visual la da el tema (Aura + Rose), no CSS local.
- Archivos `*.component.scss` para páginas/componentes de la app. Si PrimeNG + PrimeFlex no alcanzan para lograr algo, se discute antes de escribir CSS custom (excepción real, no la salida por defecto).

## Al crear una página o componente nuevo

1. Maquetar la estructura con `grid`/`col-*` o `flex` + utilidades de spacing de PrimeFlex.
2. Resolver cada elemento visual con el componente PrimeNG que le corresponde.
3. No generar `styleUrl` ni archivo `.scss` a menos que sea estrictamente necesario y ya se haya descartado una solución con utilidades.
4. Verificar que el resultado se vea correcto en el tema Aura/Light/Rose (sin asumir fondos oscuros ni colores hardcodeados).
