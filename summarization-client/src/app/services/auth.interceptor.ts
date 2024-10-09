/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Inject, Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';

import { Observable } from 'rxjs';
import { OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    public authToken:any;
    public idToken:any;

    constructor(@Inject(OKTA_AUTH) private _oktaAuth: OktaAuth, private _auth:AuthService, private _config:ConfigService) {
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(this.addAuthHeaderToAllowedOrigins(request));
    }

    private addAuthHeaderToAllowedOrigins(request: HttpRequest<any>): HttpRequest<any> {
        if (this._config.authSchema == 'basic') {
            return request
        }
        this.authToken = this._oktaAuth.getAccessToken()
        this.idToken = this._oktaAuth.getIdToken()
        return request.clone( { setHeaders: { 
            'Authorization': `Bearer ${this.authToken}`,
            'X-Authenticated-User': this.idToken } 
        });    
        return request
    }

}