/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SummarizeParamsService {
  configInfoObj: any = {
    chunkSizeVal: 1000,
    chunkOverlapVal: 100,
    chunkPromptdes:
      'Write a concise summary of the following meeting transcript.',
    finalPromptDes:
      'You will be provided summarizes from a long meeting different part, and your task is to write a final concise summary include the attendees,  3 important key topics, 3 important actions info. Do not copy the structure from the provided summarizes. Avoid repetition points.',
  };

  private parameters = new BehaviorSubject<any>(this.configInfoObj);
  parameters$ = this.parameters.asObservable();

  private dataSubject: Subject<any> = new Subject<any>();
  uploadInfo$: Observable<any> = this.dataSubject.asObservable();

  private clearConversationSubject = new Subject<void>();
  clearConversationAction$ = this.clearConversationSubject.asObservable();

  constructor() {}

  updateParameters(data: any) {
    this.parameters.next(data);
  }

  getParametersValue(): Observable<string> {
    return this.parameters.asObservable();
  }

  triggerClearConversation() {
    this.clearConversationSubject.next();
  }

  updateData(data: any): void {
    this.dataSubject.next(data);
  }
}
