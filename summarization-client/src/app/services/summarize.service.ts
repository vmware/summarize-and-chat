/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Injectable } from '@angular/core';
import { Observable, of , map} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';

import { IAppState } from '../store/reducer';
import * as AppActions from '../store/actions'
import { ConfigService } from 'src/app/services/config.service';
import { dictsToClassInstances, parseHttpErrorMsg } from '../utils/utils';

import { Model } from '../models/model';

@Injectable({
  providedIn: 'root',
})
export class SummarizeService {
  baseUrl: string;
  models: any[] = []

  constructor(private _config:ConfigService, private http: HttpClient, private _store: Store<IAppState>) {
    this.baseUrl = `${this._config.apiServerUrl}/api/v1`;
    this.getModels()
  }

  public postContentSummarize(payload: any) {
    return this.http.post(`${this.baseUrl}/summarize-content`, payload);
  }

  public postDocSummarize(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/summarize-doc`, formData);
  }

  public uploadFile(payload: any, refresh_token: string = ''): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, payload, {
      // headers: {
      //   refresh_token,
      // },
    });
  }

  public editMetadata(metaData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/metadata`, metaData);
  }

  public checkFile(fileName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/checkfile?filename=${fileName}`);
  }

  public getQuestions(fileName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/questions?filename=${fileName}`);
  }

  public audioToVtt(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/audio-to-vtt`, payload);
  }

  public getSummaryHistory(fileName: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/summary-history?filename=${fileName}`
    );
  }

  public getChatHistory(fileName: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/retrieval-history?filename=${fileName}`
    );
  }

  public delChatHistory(fileName: string, count: any): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/retrieval-history?filename=${fileName}&count=${count}`
    );
  }

  public getModels(): Observable<any> {
    if (this.models.length == 0) {
      // return this.http.get(`${this.baseUrl}/models`);
      return this.http.get(`${this.baseUrl}/models`).pipe(
        map((data:any) => {
          const modeldata = data? data: [] //data.models ? data.models : []
          this.models = dictsToClassInstances<Model>(modeldata, Model)
          if (this.models.length > 0) {
            this._store.dispatch(AppActions.setModels({models: this.models}))
          }
          return this.models
        })
      )
    }
    return of(this.models)
  }  
}
