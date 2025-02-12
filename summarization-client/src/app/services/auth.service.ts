/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Inject, Injectable, OnInit } from '@angular/core';
import { Location } from '@angular/common';
// import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
// import OktaAuth, { AuthState } from '@okta/okta-auth-js';
import { BehaviorSubject, Observable, catchError, throwError as observableThrowError, filter, map, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ALERT_TYPE, AppAlert, User, AuthUser, SessionStatus  } from '../models/common';
import { IAppState } from '../store/reducer';
import * as AuthActions from '../store/actions'
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public userSubject: BehaviorSubject<any>;
  public sessionLifetimeSubject: BehaviorSubject<SessionStatus>;

  public login_endabled:boolean = false
  public is_authenticated:boolean = false
  public user?:User
 
  private serverurl:string
  private fetching_user:boolean = false

  constructor(
    // private _oktastate: OktaAuthStateService,  
    // @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth, 
    // private _store: Store<IAppState>, 
    private http: HttpClient,
    private location: Location,
    private _config:ConfigService) { 
      this.serverurl = `${this._config.apiServerUrl}/api/v1`;
      
      const status: SessionStatus = this.loggedUser() ? SessionStatus.AUTHENTICATED : SessionStatus.NOT_AUTHENTICATED;
      this.sessionLifetimeSubject = new BehaviorSubject<SessionStatus>(status);
      window.addEventListener('storage', this.storageEventListener.bind(this));
      this.userSubject = new BehaviorSubject<AuthUser>(this.loggedUser());
  }

  public register(payload: any): Observable<any> {
    console.log(`${this.serverurl}/register`)
    return this.http.post(`${this.serverurl}/register`, payload);
  }

  public basicAuthSignIn(payload: any): Observable<any> {
    return this.http.post(`${this.serverurl}/login/basic`, payload);
  }

  // public async signIn() : Promise<void> {
  //   await this._oktaAuth.signInWithRedirect();
  // }

  // public async signOut(): Promise<void> {
  //   await this._oktaAuth.signOut();
  //   this._store.dispatch(AuthActions.setUser({ user: undefined}))
  // }

  public logout() : void {
    this.clearSession()
  }

  // fetchOktaUser(): void {
  //   if (!this.fetching_user) {
  //     this.fetching_user = true
  //     this._oktastate.authState$.pipe(
  //       filter((authState: AuthState) => !!authState && !!authState.isAuthenticated),
  //       map((authState: AuthState) => authState.idToken?.claims ?? ''),
  //       catchError((error) => {
  //         this.fetching_user = false
  //         return observableThrowError(() => error);
  //       })
  //     ).subscribe((data:any) => {  
  //       this.fetching_user = false
  //       this.user = new User(data)
  //       this.is_authenticated = true
  //       this._store.dispatch(AuthActions.setUser({ user: this.user}))
  //     })
  //   }
  // }

  private storageEventListener(event: StorageEvent) {
    if (event.storageArea === localStorage && event.key === this._config.sessionKey) {
      if (event.newValue) {
        const authUser = JSON.parse(event.newValue);
        this.userSubject.next(authUser);
      } else {
        this.logout();
      }
    }
  }

  public addUserToStorage(user: any) {
    console.log('add to storage')
    localStorage.setItem(this._config.sessionKey, JSON.stringify(user));
    this.userSubject.next(user)
    console.log(this.userSubject)
  }

  public clearSession(): void {
    // if (this.userSubject)
    //   this.userSubject.next(null);
    localStorage.removeItem(this._config.sessionKey);
  }

  redirectToLogin() {
    window.location.href = window.location.origin + '/login/basic';
  }

  public loggedUser(): any {
    const storedUser = localStorage.getItem(this._config.sessionKey);
    if (storedUser) {
      const loggedUser = JSON.parse(storedUser);
      // console.log(loggedUser)
      if (loggedUser && loggedUser.user.email && loggedUser.user.token) {
        return loggedUser;
      } else {
        this.logout(); 
      }
    }
    return null as any;
  }

  public isLoggedIn(): boolean {
    return this.loggedUser() != null;
  }

  public loggedUserListener(): Observable<User> {
    return this.userSubject.asObservable();
  }

  public sessionLifetimeListener(): Observable<SessionStatus> {
    return this.sessionLifetimeSubject.asObservable();
  }
}
