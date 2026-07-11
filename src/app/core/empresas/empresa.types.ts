export interface Empresa {
  id: number;
  ruc: string;
  nombre_empresa: string;
  email: string;
  telefono: string;
  ciudad: string;
  tipo_contribuyente: string;
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
  codActividadPrincipal: string;
  descActividadPrincipal: string;
  codActividadSecundaria?: string | null;
  descActividadSecundaria?: string | null;
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

export interface EmpresaValidationError {
  type: string;
  msg: string;
  path: string;
  location: string;
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
  codActividadPrincipal?: string;
  descActividadPrincipal?: string;
  codActividadSecundaria?: string | null;
  descActividadSecundaria?: string | null;
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
  cod_actividad_principal: string;
  desc_actividad_principal: string;
  cod_actividad_secundaria: string | null;
  desc_actividad_secundaria: string | null;
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
