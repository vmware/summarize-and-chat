/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { HttpErrorResponse } from '@angular/common/http';

export function parseHttpErrorMsg(error: HttpErrorResponse) {
    let msg = ""
    if (error.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.error.message);
      msg = `Client-side error: ${error.status} ${error?.statusText} - ${error.error.message}`;
    }
    if (msg.length == 0 && error.error) {
      if (typeof error.error === 'object' && 'message' in error.error) {
        msg = `Server: ${error.status} ${error?.statusText} - ${error.error.message}`;
      } else if (typeof error.error === 'string') {
        msg = `Server: ${error.status} ${error?.statusText} - ${error.error}`;
      } else if (error.error.detail) {
        if (typeof error.error.detail == 'string') {
          msg = `Server: ${error.status} ${error?.statusText} - ${error.error.detail}`;
        }
        else if (error.error.detail?.message) {
          msg = `Server: ${error.status} ${error?.statusText} - ${error.error.detail.message}`;
        } 
      }  
    }
    if (msg.length == 0 && error.message) {
      msg = `Server: ${error.status} ${error?.statusText} - ${error.message}`;
    }
    console.error(`API returned error: ${error.status}, body was:  ${msg}`)
    return [ msg, error?.status ];
}

export function isValidApiKey(apiKey: string): boolean {
  if (apiKey?.length > 0) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(apiKey);  
  }
  return false
}

export function dictsToClassInstances<T>(array: Array<{ [key: string]: any }>, cls: new (data: any) => T): T[] {
  return array.map(item => new cls(item));
}

export function dictToClassInstance<T>(dict: { [key: string]: any }, cls: new (data: any) => T): T {
  return new cls(dict);
}

export function getTokenLength(message: string) {
  return Math.ceil(message.length / 3) + 1
}

export function getObjTokenLength(obj:any) {
  return getTokenLength(JSON.stringify(obj))
}

export function listToDict<T>(list: T[], idGen: (arg: T) => string): { [key: string]: T } {
  const dict: { [key: string]: T } = {}

  list.forEach((element) => {
    const dictKey = idGen(element)
    dict[dictKey] = element
  })

  return dict
}
