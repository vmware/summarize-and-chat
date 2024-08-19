/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/services/config.service';

@Injectable({
  providedIn: 'root',
})
export class SummarizeRequestService {
  serviceUrl: string;

  constructor(private http: HttpClient, private config: ConfigService,) {
    this.serviceUrl = `${this.config.apiServerUrl}/api/v1`;
  }

  historyRequest(): Observable<any> {
    return this.http.get(`${this.serviceUrl}/vtt`);
  }

  downloadHistory(): Observable<any> {
    return this.http.get(`${this.serviceUrl}/download`);
  }

  deleteHistory(param: any): Observable<any> {
    return this.http.delete(`${this.serviceUrl}/file?name=${param}`);
  }

  getFileInfo(param: any): Observable<any> {
    return this.http.get(
      `${this.serviceUrl}/file?user=${param.user}&filename=${param.filename}`,
      { responseType: 'text' }
    );
  }

  getProcess(params: any) {
    return this.http.get(
      `${this.serviceUrl}/convert-process?audio=${params.audio}`
    );
  }

  getFilesList(): Observable<any> {
    return this.http.get(`${this.serviceUrl}/files`);
  }
}
