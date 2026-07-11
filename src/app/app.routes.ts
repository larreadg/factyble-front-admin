import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { AppShellComponent } from './layout/app-shell.component';
import { EmpresaEditarPageComponent } from './pages/empresas/empresa-editar-page.component';
import { EmpresaNuevoPageComponent } from './pages/empresas/empresa-nuevo-page.component';
import { EmpresasPageComponent } from './pages/empresas/empresas-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginPageComponent,
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'inicio',
        component: HomePageComponent,
      },
      {
        path: 'empresas',
        component: EmpresasPageComponent,
      },
      {
        path: 'empresas/nuevo',
        component: EmpresaNuevoPageComponent,
      },
      {
        path: 'empresas/:id',
        component: EmpresaEditarPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
