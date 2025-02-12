/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { ChangeDetectorRef, Component, ElementRef, OnInit, Inject, ViewChild } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { saveAs } from 'file-saver';
import { Store, select } from '@ngrx/store';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { marked } from 'marked';
import { ClrLoadingState } from '@clr/angular';
import { Subject, Subscription, finalize, interval, of, switchMap, takeUntil } from 'rxjs';

import { UploadFileComponent } from '../upload-file/upload-file.component';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { ChatService } from 'src/app/services/chat.service';

import { SummarizeParamsService } from '../services/summarize-params.service';
import { SummarizeRequestService } from '../services/summarize-request.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SummarizeService } from 'src/app/services/summarize.service';
import { Model, UploadObj } from 'src/app/models/model';
import { IAppState,  getModels } from 'src/app/store/reducer';

// import { OKTA_AUTH } from '@okta/okta-angular';
// import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-chat-doc',
  templateUrl: './summarize-doc.component.html',
  styleUrls: ['./summarize-doc.component.scss'],
})
export class SummarizeDocComponent implements OnInit {
  @ViewChild('upload')
  upload!: UploadFileComponent;

  @ViewChild('viewer')
  viewerRef!: ElementRef;

  private _models$ = this._store.pipe(select(getModels));
  private subs:any[] = []

  file: any;
  fileType: string = '.pdf,.docx,.txt,.pptx,.vtt,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm';
  content: any;
  options: string = 'sentence';
  copyTitle: string = 'Copy';
  outputSummary: any;
  output: any;

  pdfFilePath: string = '';
  pdfFileUrl: string = '';
  pdfFileB64: string = '';

  docSrc: any = '';
  showSummarize: boolean = false;
  loading: boolean = false;
  username: string = '';
  showPageRange: boolean = false;

  ctrl = new AbortController();
  showStop: boolean = false;
  showAIloading: boolean = false;
  fetchSource: any;
  submitBtnState: ClrLoadingState = ClrLoadingState.DEFAULT;
  switch: boolean = false;

  showPPT: boolean = false;

  uploadObj: UploadObj = {
    progressFlag: false,
    uploadProgress: 0,
  };

  rangDataObj: any = {
    startPage: 1,
    endPage: 50,
  };

  historyParams: any = {};
  intervalId: any;
  file_type: string = 'document';
  audioSrc: any;
  showVtt: boolean = true;

  processObj: any = {
    process: 0,
    status: '',
  };

  showInputLoading: boolean = false;
  showDownloadVtt: boolean = false;

  private uploadInfoSubscription: Subscription;
  private timerSubscription: Subscription | null = null;
  private stopPolling$ = new Subject<void>();

  startTime: string = '00:00:00';
  endTime: string = '02:00:00';
  timeFlag: boolean = false;
  timeStartFlag: boolean = false;
  timeEndFlag: boolean = false;
  editTemplate: boolean = true;
  showAlert: boolean = false;
  showTimeRange: boolean = false;
  template: string = 'executive';
  len: string = 'auto';
  models: any;
  configInfo: any;

  loggedUser: any;

  constructor(
    // @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth,
    private _store: Store<IAppState>,
    private el: ElementRef,
    private _clipboardService: ClipboardService,
    private _auth: AuthService,
    private config: ConfigService,
    private chatService: ChatService,
    private cd: ChangeDetectorRef,
    private summarizeParamsService: SummarizeParamsService,
    private summarizeRequestService: SummarizeRequestService,
    private summarizeService: SummarizeService
  ) {
    // const user = this._auth.user;
    // if (user && user.name) {
    //   this.username = user.email; 
    // }

    this._auth.loggedUserListener().subscribe((res) => {
      this.loggedUser = res;
      if (this.loggedUser && this.loggedUser.user && this.loggedUser.user.email) 
        this.username = this.loggedUser.user.email
    });

    this.uploadInfoSubscription =
      this.summarizeParamsService.uploadInfo$.subscribe((uploadObj) => {
        this.uploadObj = uploadObj;
        this.loading = true;
        if (
          this.uploadObj.uploadProgress == 100 &&
          !this.uploadObj.progressFlag
        ) {
          this.processFile();
        }
      });
  }

  ngOnInit(): void {
    this.chatService.setAssistValue(false);
    this.summarizeService.getModels().subscribe((models) => {
      if (models) {
        this.models = models;
        if (this.models.length > 0) {
          let selectedModel = this.models[0];
        } 
      }
    });

    this.summarizeParamsService.getParametersValue().subscribe((res) => {
      this.configInfo = res;
    });
    
    this.historyParams = history.state;
    console.log(this.historyParams)
    if (this.historyParams?.file) {
      this.file_type = this.historyParams.summary_type;
      if (this.file_type === 'document') {
        this.template = 'executive';
        this.getFile(this.historyParams?.file);
        this.editTemplate = !this.isDocumentFile(this.historyParams?.file);
      } else {
        this.template = 'meeting';
        if (this.historyParams?.vtt) {
          this.showVttFile(this.historyParams?.vtt);
        }
      }
    }

    if (this.historyParams?.index === 'done') {
      this.chatService.setAssistValue(true);
      this.chatService.setAssistFile(this.historyParams?.file);
      this.summarizeService
        .getQuestions(this.historyParams?.file)
        .subscribe((res) => {
          if (res && res.questions) {
            this.chatService.setAssistQuestions(res.questions);
          }
        });
    }

    // this.chatService.setAssistValue(false);
    this.chatService.setAssistInputOpen(false);
    this.chatService.setAssistInputPinnable(true);
    this.chatService.setAssistInputPinned(true);
  }

  checkFile() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    if (this.file && this.file?.name) {
      this.intervalId = setInterval(() => {
        this.summarizeService.checkFile(this.file?.name).subscribe((res) => {
          if (res && res?.data?.index === 'done') {
            this.chatService.setAssistValue(true);
            this.chatService.setAssistFile(this.file?.name);
            this.getAssistQuestion();
            clearInterval(this.intervalId);
          }
        });
      }, 5000);
    }
  }

  getAssistQuestion() {
    this.summarizeService.getQuestions(this.file?.name).subscribe((res) => {
      if (res && res.questions) {
        this.chatService.setAssistQuestions(res.questions);
      }
    });
  }

  getFile(filename: any) {
    let param = {
      user: this.username,
      filename,
    };
    this.outputSummary = '';
    this.showSummarize = true;
    this.loading = true;
    this.summarizeRequestService.getFileInfo(param).subscribe(
      (res: any) => {
        this.loading = false;
        if (res) {
          this.content = res;
          if (this.historyParams?.file) {
            this.buildFileObject(this.content, this.historyParams.file);
          }
        }
      },
      (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('An error occurred:', error.error);
      }
    );
  }

  buildFileObject(textContent: any, name: string) {
    var blob = new Blob([textContent], {
      type: 'application/pdf',
    });
    var file = new File([blob], name);
    this.file = file;
    let uploadFileType = this.file?.name.split('.').slice(-1)[0];
    this.showPageRange = ['docx', 'pptx', 'pdf'].includes(uploadFileType);
    this.showTimeRange = this.isAudioFile(this.file?.name);
    this.initPanel();
    this.stopAI();
    this.processFile();
    if (this.historyParams && this.historyParams?.summary) {
      this.outputSummary = marked(this.historyParams.summary, { breaks: true });
    }

    if (this.historyParams && this.historyParams?.index !== 'done') {
      this.checkFile();
    }
  }

  outFile(event: any) {
    if (event.type === 'close') {
      this.stopPolling();
      this.loading = false;
      this.content = '';
      this.audioSrc = '';
      this.outputSummary = '';
      this.output = '';
      this.showSummarize = false;
      this.file_type = 'document';
      this.showDownloadVtt = false;
      this.editTemplate = true;
      this.len = 'auto';
    }
    this.showVtt = true;
    this.file = event[0];
    if (!this.file) {
      this.chatService.setAssistValue(false);
    }
    if (this.file) {
      let uploadFileType = this.file?.name.split('.').slice(-1)[0];
      this.showPageRange = ['docx', 'pptx', 'pdf'].includes(uploadFileType);
      this.showTimeRange = this.isAudioFile(this.file?.name);
      this.editTemplate = !this.isDocumentFile(this.file.name);
    } else {
      this.showPageRange = false;
      this.showTimeRange = false;
    }
    this.initPanel();
    this.stopAI();
    this.checkFile();
  }

  processFile() {
    if (this.file) {
      this.len = 'medium';
      if (this.isDocumentFile(this.file.name)) {
        this.template = 'executive';
        if (this.file.name?.toLowerCase().endsWith('.pdf')) {
          this.previewPdf(this.file);
        } else if (this.file.name?.toLowerCase().endsWith('.docx')) {
          this.previewDoc();
        } else if (this.file.name?.toLowerCase().endsWith('.pptx')) {
          this.previewPPT(this.file);
        } else {
          this.previewFile(this.file);
        }
      } else {
        this.file_type = 'meeting';
        if (this.file.name.endsWith('.vtt')) {
          this.previewFile(this.file);
        } else {
          this.showVtt = false;
          this.audioToVtt();
        }
        this.template = 'meeting';
      }
    }
  }

  initPanel() {
    this.loading = false;
    this.content = '';
    this.docSrc = '';
    this.pdfFilePath = '';
    if (this.el.nativeElement.querySelector('#content-area')) {
      this.el.nativeElement.querySelector('#content-area').style.display =
        'flex';
    }
    if (this.el.nativeElement.querySelector('.textarea-holder')) {
      this.el.nativeElement.querySelector('.textarea-holder').style.display =
        'flex';
    }
    this.outputSummary = '';
    this.output = '';
    if (this.el.nativeElement.querySelector('.viewer')) {
      this.el.nativeElement.querySelector('.viewer').style.display = 'none';
    }
    this.showSummarize = false;
    this.showPPT = false;
  }

  previewPPT(file: any) {
    this.showPPT = true;
    this.loading = false;
    if (this.el.nativeElement.querySelector('.viewer')) {
      this.el.nativeElement.querySelector('.viewer').style.display = 'none';
    }
    if (this.el.nativeElement.querySelector('.textarea-holder')) {
      this.el.nativeElement.querySelector('.textarea-holder').style.display =
        'none';
    }
    if (this.el.nativeElement.querySelector('#content-area')) {
      this.el.nativeElement.querySelector('#content-area').style.display =
        'none';
    }
    if (this.el.nativeElement.querySelector('#all_slides_warpper')) {
      this.el.nativeElement.querySelector('#all_slides_warpper').style.display =
        'flex';
    }
    this.showSummarize = true;
  }

  previewDoc() {
    if (this.el.nativeElement.querySelector('.viewer')) {
      this.el.nativeElement.querySelector('.viewer').style.display = 'block';
    }
    this.loading = true;
    this.docSrc = '';
    const reader = new FileReader();
    reader.readAsDataURL(this.file);
    reader.onload = (_event) => {
      if (this.el.nativeElement.querySelector('.textarea-holder')) {
        this.el.nativeElement.querySelector('.textarea-holder').style.display =
          'none';
      }
      if (this.el.nativeElement.querySelector('#content-area')) {
        this.el.nativeElement.querySelector('#content-area').style.display =
          'none';
      }
      if (this.historyParams?.file) {
        this.docSrc = `${this.config.apiServerUrl}/api/v1/file?user=${this.username}&filename=${this.file.name}`;
      } else {
        this.docSrc = reader.result;
      }
      this.loading = false;
      this.showSummarize = true;
    };
  }

  previewFile(file: any) {
    const reader = new FileReader();
    reader.readAsText(file);
    this.loading = true;
    reader.onload = (evt) => {
      if (this.el.nativeElement.querySelector('.textarea-holder')) {
        this.el.nativeElement.querySelector('.textarea-holder').style.display =
          'none';
      }
      if (this.el.nativeElement.querySelector('.viewer')) {
        this.el.nativeElement.querySelector('.viewer').style.display = 'none';
      }

      this.content = evt.target?.result;
      this.loading = false;
      this.showSummarize = true;
    };
  }

  previewPdf(file: any) {
    this.pdfFileUrl = '';
    this.pdfFileB64 = '';
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      let path = event.target == null ? '' : event.target.result;
      this.pdfFilePath = path as string;

      if (this.historyParams?.file) {
        this.pdfFileUrl = `${this.config.apiServerUrl}/api/v1/file?user=${this.username}&filename=${this.file.name}`;
      } else {
        this.pdfFileB64 = this.pdfFilePath.split(',')[1];
      }

      this.loading = false;
      if (this.el.nativeElement.querySelector('#content-area')) {
        this.el.nativeElement.querySelector('#content-area').style.display =
          'none';
      }
      if (this.el.nativeElement.querySelector('.textarea-holder')) {
        this.el.nativeElement.querySelector('.textarea-holder').style.display =
          'none';
      }
      if (this.el.nativeElement.querySelector('.viewer')) {
        this.el.nativeElement.querySelector('.viewer').style.display = 'none';
      }
      this.showSummarize = true;
    };
  }

  textChange() {
    if (this.content) {
      if (this.el.nativeElement.querySelector('.textarea-holder')) {
        this.el.nativeElement.querySelector('.textarea-holder').style.display =
          'none';
      }
      if (this.el.nativeElement.querySelector('.viewer')) {
        this.el.nativeElement.querySelector('.viewer').style.display = 'none';
      }
      this.showSummarize = true;
    } else {
      this.showSummarize = false;
      if (this.el.nativeElement.querySelector('.textarea-holder')) {
        this.el.nativeElement.querySelector('.textarea-holder').style.display =
          'flex';
      }
    }
    this.changeLen();
  }

  clickSample() {
    if (this.el.nativeElement.querySelector('.textarea-holder')) {
      this.el.nativeElement.querySelector('.textarea-holder').style.display =
        'none';
    }

    this.content =
      'Education is the process by which a person either acquires or delivers some knowledge to another person. It is also where someone develops essential skills to learn social norms. However, the main goal of education is to help individuals live life and contribute to society when they become older. There are multiple types of education but traditional schooling plays a key role in measuring the success of a person. Besides this, education also helps to eliminate poverty and provides people the chance to live better lives. Let you guys know that this is one of the most important reasons why parents strive to make their kids educate as long as possible. Education is important for everyone as it helps people in living a better life with multiple facilities. It helps individuals to improve their communication skills by learning how to read, write, speak, and listen. It helps people meet basic job requirements and secure better jobs with less effort. The educated population also plays a vital role in building the economy of a nation. Countries with the highest literacy rates are likely to make positive progress in human and economical development. Therefore, it is important for everyone to get the education to live healthy and peaceful life.';
    this.showSummarize = true;
    if (this.el.nativeElement.querySelector('.viewer')) {
      this.el.nativeElement.querySelector('.viewer').style.display = 'none';
    }
    this.changeLen();
  }

  clickEdit() {
    if (this.el.nativeElement.querySelector('.textarea-holder')) {
      this.el.nativeElement.querySelector('.textarea-holder').style.display =
        'none';
    }

    this.loading = true;
    try {
      setTimeout(async () => {
        this.content = await navigator.clipboard.readText();
        this.changeLen();
        this.loading = false;
        if (this.content) {
          this.showSummarize = true;
          if (this.el.nativeElement.querySelector('.viewer')) {
            this.el.nativeElement.querySelector('.viewer').style.display =
              'none';
          }
        }
      }, 0);
    } catch (err) {}
  }

  changeLen() {
    if (this.content && this.content?.length > 1000) {
      this.len = 'medium';
    } else {
      this.len = 'auto';
    }
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

  clear() {
    this.upload.deleteFile();
    this.editTemplate = true;
    this.stopAI();
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
    if (
      this.file &&
      Object.keys(this.rangDataObj).length ==
        Object.values(this.rangDataObj).filter((v) => v).length &&
      this.rangDataObj.startPage <= this.rangDataObj.endPage &&
      this.rangDataObj.startPage >= 1 &&
      this.rangDataObj.endPage >= 1
    ) {
      this.summarizeDoc();
    } else if (this.content) {
      this.summarizeContent();
    }
  }

  summarizeContent() {
    let payload;
    if (this.configInfo.template === 'executive') {
      payload = {
        text: this.content,
        chunk_size: this.configInfo.chunkSizeVal,
        chunk_overlap: this.configInfo.chunkOverlapVal,
        chunk_prompt: this.configInfo.chunkPromptdes,
        final_prompt: this.configInfo.finalPromptDes,
        format: this.configInfo.format,
        length: this.configInfo.len,
        temperature: this.configInfo.temperature,
        model: this.configInfo.model,
      };
    } else {
      payload = {
        text: this.content,
        chunk_size: this.configInfo.chunkSizeVal,
        chunk_overlap: this.configInfo.chunkOverlapVal,
        chunk_prompt: this.configInfo.chunkPromptdes,
        final_prompt: this.configInfo.finalPromptDes,
        length: this.configInfo.len,
        temperature: this.configInfo.temperature,
        model: this.configInfo.model,
      };
    }

    this.submitBtnState = ClrLoadingState.LOADING;
    this.getStream(payload, 'summarize-content');
  }

  summarizeDoc() {
    const formData = new FormData();
    formData.append('doc', this.file.name);
    formData.append('chunk_size', this.configInfo.chunkSizeVal);
    formData.append('chunk_overlap', this.configInfo.chunkOverlapVal);
    formData.append('chunk_prompt', this.configInfo.chunkPromptdes);
    formData.append('final_prompt', this.configInfo.finalPromptDes);

    if (this.configInfo.template === 'executive') {
      formData.append('format', this.configInfo.format);
    }
    if (this.isAudioFile(this.file.name)) {
      formData.append('start_time', String(this.startTime));
      formData.append('end_time', String(this.endTime));
    } else {
      formData.append('start_page', this.rangDataObj?.startPage);
      formData.append('end_page', this.rangDataObj?.endPage);
    }
    formData.append('length', this.configInfo.len);
    formData.append('temperature', this.configInfo.temperature);
    formData.append('template', this.configInfo.template);
    formData.append('model', this.configInfo.model);
    this.submitBtnState = ClrLoadingState.LOADING;
    this.getStream(formData, 'summarize-doc');
  }

  getStream(payload: any, url: string) {
    // const token = this._oktaAuth.getAccessToken();
    const token = this.loggedUser.user.token;
    this.showAIloading = true;
    this.outputSummary = '';
    this.showStop = true;
    let that = this;

    let headers: any = {
      Authorization: `Bearer ${token}`,
    };
    if (url == 'summarize-content') {
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    }
    if (this.docSrc) {
      setTimeout(() => {
        if (this.el.nativeElement.querySelector('.previewClass')) {
          this.el.nativeElement.querySelector('.previewClass').style.height =
            'calc(83% - 100px)';
          this.el.nativeElement.querySelector('.previewClass').style.overflow =
            'auto';
        }
      }, 100);
    }
    this.showAlert = true;
    try {
      this.fetchSource = fetchEventSource(
        `${this.config.apiServerUrl}/api/v1/${url}`,
        {
          method: 'POST',
          headers: headers,
          signal: this.ctrl.signal,
          openWhenHidden: true,
          body: url == 'summarize-content' ? JSON.stringify(payload) : payload,
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
            that.showAlert = false;
            console.log('close');
            that.showStop = false;
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
    this.loading = false;
    this.submitBtnState = ClrLoadingState.DEFAULT;
    this.showAlert = false;
  };

  scrollChatToBottom() {
    this.cd.detectChanges();
    var scrollingDiv = document.getElementById('outputDiv');
    if (scrollingDiv) scrollingDiv.scrollTop = scrollingDiv.scrollHeight;
  }

  switchChange() {
    if (this.pdfFilePath && (this.pdfFileB64 || this.pdfFileUrl)) {
      this.pdfFilePath = '';
      setTimeout(() => {
        this.previewPdf(this.file);
      }, 0);
    }

    setTimeout(() => {
      if (this.docSrc && this.el.nativeElement.querySelector('.previewClass')) {
        this.el.nativeElement.querySelector('.previewClass').style.height =
          'calc(83% - 100px)';
        this.el.nativeElement.querySelector('.previewClass').style.overflow =
          'auto';
      }
      if (
        this.submitBtnState &&
        this.el.nativeElement.querySelector('.summarizeBtn')
      ) {
        this.el.nativeElement
          .querySelector('.summarizeBtn')
          .setAttribute('disabled', 'disabled');
      }
      if (
        !this.submitBtnState &&
        this.el.nativeElement.querySelector('.summarizeBtn')
      ) {
        this.el.nativeElement
          .querySelector('.summarizeBtn')
          .removeAttribute('disabled');
        ('none');
      }
      if (this.showPPT) {
        if (this.el.nativeElement.querySelector('.viewer')) {
          this.el.nativeElement.querySelector('.viewer').style.display = 'none';
        }
        if (this.el.nativeElement.querySelector('.textarea-holder')) {
          this.el.nativeElement.querySelector(
            '.textarea-holder'
          ).style.display = 'none';
        }
        if (this.el.nativeElement.querySelector('#content-area')) {
          this.el.nativeElement.querySelector('#content-area').style.display =
            'none';
        }
        if (this.el.nativeElement.querySelector('#all_slides_warpper')) {
          this.el.nativeElement.querySelector(
            '#all_slides_warpper'
          ).style.display = 'flex';
        }
      }
    }, 0);
  }

  getPageRangeData(obj: any) {
    this.rangDataObj = obj;
  }

  previewAudio(file: any) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const resource = {
        file: file,
        base64encode: reader.result as string,
        mimeType: file.type,
        id: Math.floor(Math.random() * 100),
        title: file.name,
        url: reader.result as string,
      };
      this.audioSrc = resource;
    };
    reader.readAsDataURL(file);
  }

  audioToVtt() {
    this.processObj.process = 0;
    this.processObj.status = '';
    const formData = new FormData();
    formData.append('doc', this.file.name);
    this.showInputLoading = true;
    this.content = '';
    this.summarizeService.audioToVtt(formData).subscribe(
      () => {
        this.startPolling();
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  startPolling() {
    this.timerSubscription = interval(3000)
      .pipe(
        switchMap(() => this.dealProcess()),
        takeUntil(this.stopPolling$),
        finalize(() => {
          console.log('Polling stopped.');
        })
      )
      .subscribe((result) => {
        if (result === 1) {
          this.stopPolling$.next();
        }
      });
  }

  stopPolling() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  dealProcess() {
    return this.summarizeRequestService.getProcess({ audio: this.file.name }).pipe(
      switchMap((response: any) => {
        if (response) {
          this.processObj.process =
            response.process >= 1
              ? 1 * 100
              : parseInt(response.process * 100 + '');
          if (response.process === 1) {
            this.showInputLoading = false;
            let name =
              this.file.name.slice(0, this.file.name.lastIndexOf('.')) + '.vtt';
            setTimeout(() => {
              this.showVttFile(name);
            }, 2000);
            this.previewAudio(this.file);
            console.log('Process is done. Stopped polling.');
            return of(1);
          } else {
            console.log('Process is still in progress. Continuing polling...');
            return of(response.process);
          }
        } else {
          console.log('Error in process response. Stopped polling.');
          return of(-1);
        }
      })
    );
  }

  showVttFile(filename: any) {
    let param = {
      user: this.username,
      filename,
    };
    this.showVtt = false;
    this.outputSummary = '';
    this.showDownloadVtt = true;
    this.loading = true;
    this.summarizeRequestService.getFileInfo(param).subscribe(
      (res: any) => {
        if (res) {
          this.loading = false;
          this.showSummarize = true;
          this.content = marked(res, { breaks: true });
          if (this.historyParams?.vtt) {
            this.buildFileObject(this.content, this.historyParams.vtt);
          }
        }
      },
      (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('An error occurred:', error.error);
      }
    );
  }

  rangeStartData(event: any) {
    this.startTime = event.startTime;
    this.timeStartFlag = event.startStatus == 'error';
    this.timeFlag = this.timeStartFlag || this.timeEndFlag;
  }

  rangeEndData(event: any) {
    this.endTime = event.endTime;
    this.timeEndFlag = event.endStatus == 'error';
    this.timeFlag = this.timeStartFlag || this.timeEndFlag;
  }

  isDocumentFile(fileName: string) {
    const documentFileTypes = ['pdf', 'docx', 'txt', 'pptx'];
    let uploadFileType = fileName.split('.').slice(-1)[0];
    return documentFileTypes.includes(uploadFileType);
  }

  isAudioFile(fileName: string) {
    const audioFileTypes = [
      'vtt',
      'mp3',
      'mp4',
      'mpeg',
      'mpga',
      'm4a',
      'wav',
      'webm',
    ];
    let uploadFileType = fileName?.split('.').slice(-1)[0];
    return audioFileTypes.includes(uploadFileType);
  }

  ngOnDestroy(): void {
    this.uploadInfoSubscription.unsubscribe();
    clearInterval(this.intervalId);
    if (this.file_type == 'meeting') {
      this.stopPolling();
    }
    this.intervalId = null;
  }
}
