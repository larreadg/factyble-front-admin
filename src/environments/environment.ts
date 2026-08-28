export const environment = {
  production: true,
  // Vacío = mismo origen: el backend sirve este build en /portal-admin, así que
  // `${environment.apiUrl}/recurso` queda como `/recurso`. El build no depende de la IP de la
  // máquina. Para desarrollo local está environment.development.ts, que apunta al puerto de la API.
  apiUrl: '',
  appVersion: '1.0.0',
  appName: 'Factyble Admin',
};
