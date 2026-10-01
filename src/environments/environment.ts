export const environment = {
  production: true,
  // El front se sirve bajo /portal-admin en el mismo origen que la API (factyble.simplifika.lat), y
  // el proxy expone la API bajo /api. Relativo para no atar el build al dominio. Para desarrollo
  // local está environment.development.ts, que apunta al puerto de la API.
  apiUrl: '/api',
  appVersion: '1.0.0',
  appName: 'Factyble Admin',
};
