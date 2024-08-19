/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Inject, Injectable, OnInit } from '@angular/core';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import OktaAuth, { AuthState } from '@okta/okta-auth-js';
import { BehaviorSubject, Observable, catchError, throwError as observableThrowError, filter, map, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ALERT_TYPE, AppAlert,User } from '../models/common';
import { IAppState } from '../store/reducer';
import * as AuthActions from '../store/actions'
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { parseHttpErrorMsg } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public _user$:BehaviorSubject<any> = new BehaviorSubject<any>(undefined)

  public login_endabled:boolean = false
  public is_authenticated:boolean = false
  public user?:User

  private serverurl:string
  private httpheader:any
  private fetching_user:boolean = false

  constructor(
    private _oktastate: OktaAuthStateService,  
    @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth, 
    private _store: Store<IAppState>, 
    private _http: HttpClient, 
    private _config:ConfigService) { 
      this.serverurl = _config.apiServerUrl
      // this.httpheader = {
      //   "Content-Type": "application/json",
      //   "Authorization": `Bearer ${_config.adminToken}`
      // }
      this.fetchUser()
  }

  public async signIn() : Promise<void> {
    await this._oktaAuth.signInWithRedirect();
  }

  public async signOut(): Promise<void> {
    await this._oktaAuth.signOut();
    this._store.dispatch(AuthActions.setUser({ user: undefined}))
  }

  fetchUser(): void {
    if (!this.fetching_user) {
      this.fetching_user = true
      this._oktastate.authState$.pipe(
        filter((authState: AuthState) => !!authState && !!authState.isAuthenticated),
        map((authState: AuthState) => authState.idToken?.claims ?? ''),
        catchError((error) => {
          this.fetching_user = false
          return observableThrowError(() => error);
        })
      ).subscribe((data:any) => {  
        this.fetching_user = false
        this.user = new User(data)
        this.is_authenticated = true
        this._store.dispatch(AuthActions.setUser({ user: this.user}))
      })
    }
  }
}
