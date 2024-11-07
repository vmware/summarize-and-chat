/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Injectable } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { FaqComponent } from './components/faq/faq.component';
import { BasicLoginComponent } from './components/login/basic-login/basic-login.component';
// import { OktaAuthGuard, OktaCallbackComponent } from '@okta/okta-angular';
import { AuthService } from 'src/app/services/auth.service';
import { AuthGuard } from 'src/app/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () =>
      import('./components/home/home.module').then((m) => m.HomeModule),
  },
  // { path: 'login/callback', component: OktaCallbackComponent },
  {
    path: 'nav',
    loadChildren: () =>
      import('./components/summarizer/summarizer.module').then((m) => m.SummarizerModule),
    canActivate: mapToCanActivate([AuthGuard]),
  },
  {
    path: 'nav',
    loadChildren: () =>
      import('./components/files/files.module').then((m) => m.FilesModule),
    canActivate: mapToCanActivate([AuthGuard]),
  },
  {
    path: 'faq',
    component: FaqComponent,
  },
  { path: 'login/basic', component: BasicLoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

