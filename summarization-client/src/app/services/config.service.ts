/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Environment } from '../models/env';


@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private ENV_CONFIG = '${APP_CONFIG}';
  
  get isProd(): boolean { return !this.config_env ? environment.production : false }
  get apiServerUrl(): string  { return !this.config_env ? environment.serviceUrl : this.config_env.serviceUrl }

  get authSchema(): string { return !this.config_env ? environment.authSchema : this.config_env.authSchema }
  get sessionKey(): string { return !this.config_env ? environment.sessionKey : this.config_env.sessionKey }

  get ssoAuthUrl(): string { return !this.config_env ? environment.ssoIssuer : this.config_env.ssoIssuer }
  get clientId():string { return !this.config_env ? environment.ssoClientId : this.config_env.ssoClientId }
  get redirectUrl():string { return !this.config_env ? environment.redirectUrl : this.config_env.redirectUrl }

  // get adminToken(): string { return  !this.config_env ? environment.adminToken : this.config_env.adminToken}
  get title(): string { return  !this.config_env ? environment.title : this.config_env.title}
  get contactUs(): string { return  !this.config_env ? environment.contactUs : this.config_env.contactUs}

  private config_env?:Environment = undefined

  constructor() { 
    if (this.ENV_CONFIG == 'stg' && environment.production ) {
      const stgenv = require('../../environments/environment.stg')
      if (stgenv) {
          this.config_env = stgenv.environment
          console.log("The staging env has been detected, use the staging configurations")
      }
    }
    if (this.ENV_CONFIG == 'dev' && environment.production ) {
      const devenv = require('../../environments/environment.dev')
      if (devenv) {
          this.config_env = devenv.environment
          console.log("The dev env has been detected, use the dev configurations")
      }
    }
  }  
}
