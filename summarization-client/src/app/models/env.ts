/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export interface Environment {
    production: boolean;
    title: string;
    serviceUrl: string;
    ssoIssuer: string;
    ssoClientId: string;
    redirectUrl: string;
    adminToken?: string;
    contactUs: string;
    authSchema: string;
    sessionKey: string;
  }