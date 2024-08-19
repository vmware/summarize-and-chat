/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { SummarizeRequestService } from '../../summarizer/services/summarize-request.service';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { SummarizeService } from 'src/app/services/summarize.service';
import { ChatService } from 'src/app/services/chat.service';

import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
})
export class FileListComponent implements OnInit {
  listData: Array<any> = [];
  email: string = '';
  loading: boolean = false;
  errMessage: string = '';
  showUpload: boolean = false;
  showEdit: boolean = false;
  data: any = '';
  selected: any[] = [];
  showAnalyze: boolean = false;
  selectedFiles: any[] = [];
  file_type: string = 'document';
  chat_file: string = '';

  constructor(
    private summarizeRequestService: SummarizeRequestService,
    private _auth: AuthService,
    private router: Router,
    private config: ConfigService,
    private summarizeService: SummarizeService,
    private chatService: ChatService) {
    const user = this._auth.user;
    if (user && user.email) {
      this.email = user.email;
    }
  }

  ngOnInit(): void {
    this.chatService.setAssistValue(false);
    this.getListData();
  }

  getListData() {
    this.loading = true;
    this.summarizeRequestService
      .getFilesList()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res: any) => {
        if (res && res?.data.length >= 0) {
          this.listData = res.data;
          this.loading = false;
        }
      });
  }

  onDownload(data: any) {
    const a = document.createElement('a');
    let fileName = data.file;
    if (data.summary_type === 'meeting') {
      fileName = data.vtt;
    }
    a.setAttribute(
      'href',
      `${this.config.apiServerUrl}/api/v1/download?user=${this.email}&filename=${fileName}`
    );
    a.setAttribute('download', 'test');
    a.click();
  }

  onDelete(data: any) {
    this.errMessage = '';
    this.summarizeRequestService.deleteHistory(data?.file).subscribe(
      (res: any) => {
        if (res && res.data == 'success') {
          this.getListData();
        }
      },
      (err) => {
        this.errMessage = err?.error?.message;
        console.log(this.errMessage);
      }
    );
  }

  refresh() {
    this.getListData();
  }

  summarize(data: any) {
    this.chatService.setAssistValue(false);
    this.router.navigate(['/nav/doc'], { state: data });
  }

  clickUpload() {
    this.showUpload = true;
  }

  uploadOut(event: any) {
    if (event) {
      this.showUpload = false;
      this.getListData();
    } else {
      this.showUpload = false;
    }
  }

  clickEdit(data: any) {
    this.data = data;
    this.showEdit = true;
  }

  editOut(event: any) {
    if (event) {
      this.showEdit = false;
      this.getListData();
    } else {
      this.showEdit = false;
    }
  }

  selectionChanged(event: any) {
    if (
      this.selected &&
      this.selected.length > 1 &&
      this.isSameFile() &&
      this.selected.length < 6
    ) {
      this.showAnalyze = true;
    } else {
      this.showAnalyze = false;
    }
  }

  isSameFile() {
    let suffix = new Set();
    this.selectedFiles = [];
    for (let item of this.selected) {
      if (item.vtt) {
        this.selectedFiles.push(item.vtt);
        suffix.add(item.vtt.substring(item.vtt.lastIndexOf('.')));
      } else {
        this.selectedFiles.push(item.file);
        suffix.add(item.file.substring(item.file.lastIndexOf('.')));
      }
      if (suffix.size > 1) {
        return false;
      }
    }
    return true;
  }

  clickAnalyze() {
    this.router.navigate(['/nav/summarizeMutFile'], {
      queryParams: {
        selectedFiles: this.selectedFiles,
      },
    });
  }

  download(summary: any, file: string) {
    if (summary) {
      let blob;
      blob = new Blob([summary], {
        type: 'text/plain;charset=utf-8',
      });
      const date = new Date();
      const dateString = `${
        date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1
      }${date.getDate()}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
      saveAs(blob, `Export_summarize_${file}_report__${dateString}.doc`);
    }
  }

  chat(item: any) {
    if (this.chat_file !== item.file) {
      this.chatService.setAssistValue(false);
      this.chat_file = item.file;
    } else {
      this.chat_file = item.file;
    }
    setTimeout(() => {
      this.chatService.setAssistValue(true);
      this.chatService.setAssistInputOpen(true);
      this.chatService.setAssistInputPinnable(false);
      this.chatService.setAssistInputPinned(false);
      this.chatService.setAssistFile(this.chat_file);
      this.summarizeService.getQuestions(this.chat_file).subscribe((res) => {
        if (res && res.questions) {
          this.chatService.setAssistQuestions(res.questions);
        }
      });
    });
  }
}
