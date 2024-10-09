/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { Router } from '@angular/router';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SummarizeService } from 'src/app/services/summarize.service';

import { OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { Store, select } from '@ngrx/store';
import { User } from 'src/app/models/common';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { IAppState,  getUser } from 'src/app/store/reducer';
import { ConfigService } from 'src/app/services/config.service';
import * as AppActions from '../../store/actions'

// import { marked } from 'marked';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('assist')
  assist: any;
  @Output('outPinned')
  outPinnedEmitter = new EventEmitter();
  @Input('showAssist')
  showAssist!: boolean;

  title: string = 'Summarize and Chat';

  is_authenticated:boolean = false
  user?:User

  private _user$ = this._store.pipe(select(getUser))
  private subs:any[] = []

  userStr: string = '';

  helps = 'How may I help you today?';
  // prompt = 'Ask anything or try one of the following prompts';
  inputQuestions: any = [];

  canAssist: boolean = false;
  output: string = '';
  messages: any;
  ctrl = new AbortController();
  conversation: any = null;
  inputPinned = true;
  inputPinnable = true;
  inputOpen = false;
  history: any = [];

  constructor(
    @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth,
    private _store: Store<IAppState>,
    private _auth:AuthService,
    private _config:ConfigService,
    private _summarizeService: SummarizeService,
    private _chatService: ChatService,
    private router: Router) {
  }

  public ngOnInit(): void {
    this._auth.fetchOktaUser()
    this.subs.push(this._user$.subscribe(u => {
      this.user = u;
      this.userStr = this.user? this.user.first_name : '';
      this.is_authenticated = this.user !== null
    }))

    this.title = this._config.title;
    
    this._chatService.getAssistValue().subscribe((res) => {
      this.canAssist = res;
      if (!this.canAssist) {
        this.ctrl.abort();
        this.ctrl = new AbortController();
      }
    });

    this.conversation = { messages: [], responses: [] };

    this._chatService.getAssistQuestions().subscribe((res) => {
      this.inputQuestions = this.getRandomQuestions(res, 3);
    });

    this._chatService
      .getAssistInputOpen()
      .subscribe((res) => [(this.inputOpen = res)]);

    this._chatService.getAssistInputPinnable().subscribe((res) => {
      this.inputPinnable = res;
    });

    this._chatService.getAssistInputPinned().subscribe((res) => {
      this.inputPinned = res;
    });

    this._chatService.getAssistHistory().subscribe((res) => {
      this.history = res;
    });
  }

  public ngOnDestroy(): void {
    this.subs.forEach(s => s?.unsubscribe())
  }

  public async login(payload?: any) : Promise<void> {
    console.log('login');
    if (this._config.authSchema == 'okta') {
      console.log('okta');
      await this._auth.signIn()
    } else {
      console.log('basic');
      this.router.navigateByUrl('/login/basic');
      // this._auth.basicAuthSignIn(payload)
    }
  }

  public async logout(): Promise<void> {
    await this._auth.signOut()
  }

  getRandomQuestions(array: any, count: number): string[] {
    const shuffledArray = array.slice();
    let selectedQuestions = [];
    for (
      let i = shuffledArray.length - 1;
      i > 0 && selectedQuestions.length < count;
      i--
    ) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[randomIndex]] = [
        shuffledArray[randomIndex],
        shuffledArray[i],
      ];
      selectedQuestions.push(shuffledArray[i]);
    }
    return selectedQuestions;
  }

  sendOut(event: any) {
    this.messages = event.messages;
    this.conversation.messages = event.messages;
    this.conversation.responses = event.responses;
    this.fetchSource();
  }

  fetchSource() {
    let fileName = '';
    this._chatService.getAssistFile().subscribe((res) => {
      fileName = res;
    });

    const token = this._oktaAuth.getAccessToken();
    const requestData = {
      file: fileName,
      query: this.messages[this.messages.length - 1]?.message,
    };
    let that = this;
    let errMessage = 'Summarizer server error, please try again later!';
    fetchEventSource(`${this._config.apiServerUrl}/api/v1/retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: this.ctrl.signal,
      openWhenHidden: true,
      body: JSON.stringify(requestData),
      onopen: async (response: any) => {
        that.output = '';
        // if (
        //   response.ok &&
        //   response.headers.get('content-type') ===
        //     'text/event-stream;charset=utf-8; charset=utf-8'
        // )
        if (response.ok) {
          that.assist?.setResponse('');
        } else if (response.status == 401) {
          console.log('401 error');
          // localStorage.removeItem(that.env.config.sessionKey);
          window.location.href = window.location.origin + '/';
          return;
        } else {
          console.log('error');
          const detail = await response.json();
          if (detail.message) {
            errMessage = detail.message;
          }
          throw new Error(errMessage);
        }
      },

      onmessage: async (event: any) => {
        const json_data = JSON.parse(event.data);
 
        // let text = markdownToTxt(json_data.text); //json_data.text.replace(/<[^>]+>/g, '').replace(/[*_`~#\[\]]+/g, '');
        let text = json_data.text;
        that.output += text;

        if (json_data.finish && json_data.finish !== 'null') {
          console.log('response: ', that.output);
        }
        if (text && that.assist) {
          that.assist?.setResponse(text);
        }
      },

      onerror(error) {
        console.log('onerror ', error);
        that.assist.setErrMessage(errMessage);
        throw new Error();
      },

      async onclose() {
        console.log('close');
      },
    });
  }

  showPin(event: any) {
    if (event && !event.open && window.location.pathname === '/nav/files') {
      this.canAssist = false;
    }
    this.outPinnedEmitter.emit(event);
  }

  delHistory(event: any) {
    let fileName = '';
    this._chatService.getAssistFile().subscribe((res) => {
      fileName = res;
    });
    this._summarizeService.delChatHistory(fileName, event).subscribe((res) => {
      this.history = [];
    });
  }

  getHistory() {
    let fileName = '';
    this._chatService.getAssistFile().subscribe((res) => {
      fileName = res;
    });
    this._summarizeService.getChatHistory(fileName).subscribe((res) => {
      if (res && res.history) {
        this.history = res.history;
        console.log(this.history)
      }
    });
  }
}
