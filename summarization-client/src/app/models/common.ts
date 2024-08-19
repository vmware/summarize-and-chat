/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export class User {
  id:number
  email:string
  first_name:string
  last_name:string
  name:string
  role:string
  exp:number
  auth_time?:number
  jti?:string
  api_tokens:string
  defaults:{ [key: string]: string } = {};

  constructor(data:any) {
      this.id = data?.id
      this.email = data?.email || ""
      this.first_name = data?.first_name || data?.firstName || ""
      this.last_name = data?.last_name || data?.lastName || ""
      this.name = data?.name || ""
      this.exp = data?.exp || 0
      this.auth_time = data?.auth_time || 0
      this.jti = data?.jti 
      this.role = data?.role || 'user'
      this.api_tokens = data?.api_tokens || ""
      this.defaults = Object.assign({}, data.defaults) || {}
  }
  get_default(key:string) {
      return this.defaults[key] !== undefined ? this.defaults[key] : '';
  }
  set_default(key:string, value:string) {
      this.defaults[key] = value;
  }

}

export enum EVENT_TYPE {
  SELECT = "select",
  CLEAR_CONVERSATION = "clear_conversation",
  CLOSE = "close",
  SAVE = "save",
  DELETE = 'delete',
  CONFIRM = "confirm",
  SUBMIT = "submit",
  OPEN = "open",
}

export class AppEvent extends Event {
  message?:string
  data?:any
  constructor(type:EVENT_TYPE, data?:any, message?:string) {
      super(type)
      this.message = message
      this.data = data
  }
}

export enum ALERT_TYPE {
  ERROR = "error",
  WARNING = "warning",
  INFO = "success"
}

export class AppAlert {
  alert_type:ALERT_TYPE
  message:string
  app_level:boolean = false
  alert_duration:number
  error?:any
  get type():string { return this.alert_type }

  constructor(message:string, alert_type:ALERT_TYPE = ALERT_TYPE.ERROR, alert_duration:number = 5000, app_level:boolean = false, error?:any) {
      this.alert_type = alert_type
      this.message = message
      this.alert_duration = alert_duration
      this.app_level = app_level
      this.error = error
  }
}




