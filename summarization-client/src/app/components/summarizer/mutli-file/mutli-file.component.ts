/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Inject,
  ViewChild,
} from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { saveAs } from 'file-saver';
import { UploadFileComponent } from '../upload-file/upload-file.component';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { marked } from 'marked';
import { ClrLoadingState } from '@clr/angular';
import { SummarizeParamsService } from '../services/summarize-params.service';
import { SummarizeService } from 'src/app/services/summarize.service';
import { ActivatedRoute } from '@angular/router';

import { OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-mutli-file',
  templateUrl: './mutli-file.component.html',
  styleUrls: [
    './mutli-file.component.scss',
    '../summarize-doc/summarize-doc.component.scss',
  ],
})
export class MutliFileComponent implements OnInit {
  @ViewChild('upload')
  upload!: UploadFileComponent;

  @ViewChild('viewer')
  viewerRef!: ElementRef;

  files: any;
  copyTitle: string = 'Copy';
  outputSummary: any;
  output: any;

  showSummarize: boolean = false;
  loading: boolean = false;
  email: string = '';

  ctrl = new AbortController();
  showStop: boolean = false;
  showAIloading: boolean = false;
  fetchSource: any;
  submitBtnState: ClrLoadingState = ClrLoadingState.DEFAULT;
  more: boolean = false;
  num: number = 2;
  configInfo: any;
  showAlert: boolean = false;

  constructor(
    @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth,
    private _clipboardService: ClipboardService,
    private _auth: AuthService,
    private config: ConfigService,
    private cd: ChangeDetectorRef,
    private summarizeParamsService: SummarizeParamsService,
    private summarizeService: SummarizeService,
    private route: ActivatedRoute
  ) {
    this.summarizeService.getModels().subscribe((models) => {
      this.summarizeParamsService.getParametersValue().subscribe((res) => {
        this.configInfo = res;
        console.log(this.configInfo)
      });
    });
  }

  ngOnInit(): void {
    const user = this._auth.user;
    if (user && user.email) {
      this.email = user.email;
    }

    this.summarizeParamsService.updateParameters(this.configInfo);
    this.route.queryParams.subscribe((params) => {
      this.files =
        params['selectedFiles'] instanceof Array
          ? params['selectedFiles']
          : params['selectedFiles']
          ? [params['selectedFiles']]
          : [];
      if (this.files && this.files.length > 1) {
        this.showSummarize = true;
      }
    });
  }

  initPanel() {
    this.loading = false;
    this.outputSummary = '';
    this.output = '';
    this.showSummarize = false;
  }

  copy() {
    if (this.output) {
      this._clipboardService.copy(this.output);
      this.copyTitle = 'Copied';
      setTimeout(() => {
        this.copyTitle = 'Copy';
      }, 3000);
    }
  }

  download() {
    if (this.outputSummary) {
      let blob;
      blob = new Blob([this.outputSummary], {
        type: 'text/plain;charset=utf-8',
      });
      const date = new Date();
      const dateString = `${
        date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1
      }${date.getDate()}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
      saveAs(blob, `Export_summarize_report__${dateString}.doc`);
    }
  }

  summarizeClick() {
    this.ctrl.abort();
    this.ctrl = new AbortController();
    this.summarizeContent();
  }

  summarizeContent() {
    const payload = {
      file: this.files,
      chunk_size: this.configInfo.chunkSizeVal,
      chunk_overlap: this.configInfo.chunkOverlapVal,
      prompt: this.configInfo.chunkPromptdes,
      format: this.configInfo.format,
      length: this.configInfo.len,
      temperature: this.configInfo.temperature,
      model: this.configInfo.model,
    };
    this.submitBtnState = ClrLoadingState.LOADING;
    this.getStream(payload);
  }

  getStream(payload: any) {
    const token = this._oktaAuth.getAccessToken();
    this.showAIloading = true;
    this.outputSummary = '';
    this.showStop = true;
    let that = this;

    let headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    this.showAlert = true;
    try {
      this.fetchSource = fetchEventSource(
        `${this.config.apiServerUrl}/api/v1/analyze`,
        {
          method: 'POST',
          headers: headers,
          signal: this.ctrl.signal,
          openWhenHidden: true,
          body: JSON.stringify(payload),
          async onopen(response) {
            that.showAIloading = false;
            that.outputSummary = '';
            that.output = '';
            if (
              response.ok &&
              response.headers.get('content-type') ===
                'text/event-stream;charset=utf-8; charset=utf-8'
            ) {
              console.log("everything's good");
            } else if (response.status == 401) {
              window.location.href = window.location.origin + '/';
              return;
            } else {
              console.log('error');
            }
          },

          async onmessage(event) {
            if (event) {
              const json_data = JSON.parse(event.data);
              that.output += json_data.text;
              if (json_data.finish) {
                console.log(that.output);
              }
              that.outputSummary = marked(that.output, { breaks: true });
              that.scrollChatToBottom();
            }
          },

          onerror(error) {
            throw new Error();
          },

          async onclose() {
            // if the server closes the connection unexpectedly, retry:
            that.submitBtnState = ClrLoadingState.DEFAULT;
            console.log('close');
            that.showStop = false;
            that.showAlert = false;
          },
        }
      );
    } catch (err: any) {
      if (err.name == 'AbortError') {
        console.log('Aborted!');
      } else {
        console.log(err);
      }
    }
  }

  stopAI = () => {
    this.ctrl.abort();
    this.ctrl = new AbortController();
    this.showStop = false;
    this.showAIloading = false;
    this.submitBtnState = ClrLoadingState.DEFAULT;
    this.showAlert = false;
  };

  scrollChatToBottom() {
    this.cd.detectChanges();
    var scrollingDiv = document.getElementById('outputDiv');
    if (scrollingDiv) scrollingDiv.scrollTop = scrollingDiv.scrollHeight;
  }

  showMore() {
    this.num = this.files.length;
    this.more = true;
  }

  hide() {
    this.num = 2;
    this.more = false;
  }
}
