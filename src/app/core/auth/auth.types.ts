export interface ApiResponse<T> {
  status: 'success' | 'error';
  code: number;
  data: T;
  message: string;
}

export interface LoginPayload {
  usuario: string;
  password: string;
  captcha: string;
}

export interface LoginResponseData {
  token: string;
}

export interface AuthUser {
  email: string;
  documento: string;
}

export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  usuario?: {
    email?: string;
    documento?: string;
  };
  [key: string]: unknown;
}
