/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Inject, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError as observableThrowError, filter, map, switchMap, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { parseHttpErrorMsg } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private assistBehaviorSubject = new BehaviorSubject<boolean>(false);
  private assistFileSubject = new BehaviorSubject<string>('');
  private assistQuestionsSubject = new BehaviorSubject<[]>([]);
  private assistInputPinned = new BehaviorSubject<boolean>(false);
  private assistInputOpen = new BehaviorSubject<boolean>(false);
  private assistInputPinnable = new BehaviorSubject<boolean>(false);
  private assistHistory = new BehaviorSubject<[]>([]);

  setAssistValue(value: boolean) {
    this.assistBehaviorSubject.next(value);
  }

  getAssistValue(): Observable<any> {
    return this.assistBehaviorSubject.asObservable();
  }

  setAssistFile(fileName: string) {
    this.assistFileSubject.next(fileName);
  }

  getAssistFile(): Observable<any> {
    return this.assistFileSubject.asObservable();
  }

  setAssistQuestions(questions: []) {
    this.assistQuestionsSubject.next(questions);
  }

  getAssistQuestions(): Observable<any> {
    return this.assistQuestionsSubject.asObservable();
  }

  setAssistInputPinned(value: boolean) {
    this.assistInputPinned.next(value);
  }

  getAssistInputPinned(): Observable<boolean> {
    return this.assistInputPinned.asObservable();
  }

  setAssistInputOpen(value: boolean) {
    this.assistInputOpen.next(value);
  }

  getAssistInputOpen(): Observable<boolean> {
    return this.assistInputOpen.asObservable();
  }

  setAssistInputPinnable(value: boolean) {
    this.assistInputPinnable.next(value);
  }

  getAssistInputPinnable(): Observable<boolean> {
    return this.assistInputPinnable.asObservable();
  }

  setAssistHistory(history: []) {
    this.assistHistory.next(history);
  }

  getAssistHistory(): Observable<any> {
    return this.assistHistory.asObservable();
  }
}
