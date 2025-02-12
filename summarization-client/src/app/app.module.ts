/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';

import { HomeModule } from './components/home/home.module';
import { CdsModule } from '@cds/angular';
import { CdsIconService } from './services/cds-icon.service';

import { ChatModule } from './components/chat/chat.module';
import { SummarizerModule } from './components/summarizer/summarizer.module';

import { NavComponent } from './components/nav/nav.component';
import { HeaderComponent } from './components/header/header.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FaqComponent } from './components/faq/faq.component';
import { BasicLoginComponent } from './components/login/basic-login/basic-login.component';

import { StoreModule } from '@ngrx/store';

// import { OktaAuthModule } from '@okta/okta-angular';
// import { OktaAuth } from '@okta/okta-auth-js';
import { environment } from 'src/environments/environment';
import { AuthInterceptor } from './services/auth.interceptor';
import { appReducers } from './store/reducer';

// export const oktaAuth = new OktaAuth({
//   issuer: environment.ssoIssuer,
//   clientId: environment.ssoClientId,
//   redirectUri: environment.redirectUrl
// })

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HeaderComponent,
    FaqComponent,
    BasicLoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    ClarityModule,
    CdsModule,
    HomeModule,
    SummarizerModule,
    ChatModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(appReducers),
    // OktaAuthModule.forRoot({ oktaAuth })
  ],

  providers: [
    CdsIconService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
