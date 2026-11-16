export interface Empresa {
  id: number;
  ruc: string;
  nombre_empresa: string;
  email: string;
  telefono: string;
  ciudad: string;
  tipo_contribuyente: string;
  // Envío a SIFEN pausado (la emisión sigue; ver PUT sifenPausado).
  sifen_pausado: boolean;
  fecha_creacion: string;
  cantidadEstablecimientos: number;
  cantidadUsuarios: number;
  certificadoActivo: {
    estado: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'REVOCADO';
    fecha_vencimiento: string;
  } | null;
}

export interface EmpresaPaginatedResponse {
  items: Empresa[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

export type TipoContribuyente = 'FISICA' | 'JURIDICA';

export type TipoImpuesto = 'IVA' | 'ISC' | 'RENTA' | 'NINGUNO' | 'IVA_RENTA';

export interface EmpresaCreateData {
  ruc: string;
  rucSinDv: string;
  digitoVerificador: string;
  nombreEmpresa: string;
  timbrado: string;
  direccion: string;
  vigenteDesde: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipoContribuyente: TipoContribuyente;
  tipoImpuesto: TipoImpuesto;
  // De 1 a 9; la primera es la principal.
  actividadesEconomicas: ActividadEconomica[];
  codMoneda?: string;
  descMoneda?: string | null;
  csc: string;
  cscId: string;
}

export interface EmpresaCreateCaja {
  nombre: string;
  codigo: string;
}

export interface EmpresaCreateEstablecimiento {
  nombre: string;
  direccion: string;
  numeroCasa?: string | null;
  telefono?: string | null;
  codigo: string;
  codDistrito: string;
  codCiudad: string;
  codDepartamento: string;
  cajas: EmpresaCreateCaja[];
}

export interface EmpresaCreateUsuarioAdmin {
  nombres: string;
  apellidos: string;
  email: string;
  documento: string;
  telefono: string;
  password: string;
}

export interface EmpresaCreateCertificado {
  alias: string;
  clave: string;
}

export interface EmpresaCreatePayload {
  empresa: EmpresaCreateData;
  establecimientos: EmpresaCreateEstablecimiento[];
  usuarioAdmin: EmpresaCreateUsuarioAdmin;
  certificado: EmpresaCreateCertificado;
}

// Detalle de un error de validación del back: en toda respuesta de error viene en data.errores.
// Actividad económica del emisor (MT v150, gActEco): código y descripción.
export interface ActividadEconomica {
  codigo: string;
  descripcion: string;
}

export interface EmpresaValidationError {
  campo: string | null;
  mensaje: string;
  ubicacion: string | null;
}

export interface EmpresaUpdatePayload {
  ruc?: string;
  rucSinDv?: string;
  digitoVerificador?: string;
  nombreEmpresa?: string;
  timbrado?: string;
  direccion?: string;
  vigenteDesde?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  tipoContribuyente?: TipoContribuyente;
  tipoImpuesto?: TipoImpuesto;
  // Si viene, reemplaza la lista entera.
  actividadesEconomicas?: ActividadEconomica[];
  // Pausa (true) o reanuda (false) el envío a SIFEN de la empresa.
  sifenPausado?: boolean;
  codMoneda?: string;
  descMoneda?: string | null;
  csc?: string;
  cscId?: string;
  certificado?: EmpresaCreateCertificado;
}

export interface EmpresaDetail {
  id: number;
  ruc: string;
  nombre_empresa: string;
  timbrado: string;
  direccion: string;
  vigente_desde: string;
  telefono: string;
  email: string;
  ciudad: string;
  logo: string | null;
  ruc_sin_dv: string;
  digito_verificador: string;
  tipo_contribuyente: string;
  tipo_impuesto: string;
  // En orden: la primera es la principal.
  actividades_economicas: ActividadEconomica[];
  sifen_pausado: boolean;
  cod_moneda: string;
  desc_moneda: string | null;
  csc_id: string;
  fecha_creacion: string;
  establecimientos: Array<{
    id: number;
    nombre: string;
    direccion: string;
    numero_casa: string | null;
    telefono: string | null;
    codigo: string;
    cod_distrito: string;
    cod_ciudad: string;
    cod_departamento: string;
    cajas: Array<{
      id: number;
      nombre: string;
      codigo: string;
      secuencia_factura: { valor: number };
      secuencia_nota_credito: { valor: number };
      secuencia_recibo: { valor: number };
    }>;
  }>;
  usuarios: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    documento: string;
    telefono: string;
  }>;
  certificados: Array<{
    id: number;
    alias: string;
    fecha_vencimiento: string;
    activo: boolean;
    estado: string;
  }>;
}
