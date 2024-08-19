/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ClrLoadingState } from '@clr/angular';
import { finalize } from 'rxjs';
import { SummarizeService } from 'src/app/services/summarize.service';
import { AuthService } from 'src/app/services/auth.service';

const CHUNK_SIZE = 2 * 1024 * 1024;
const MAX_SIZE = 200 * 1024 * 1024;

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnInit {
  @Output('uploadOut') uploadOutEmitter = new EventEmitter();
  inputUpdateFileName: string = '';
  file: any = false;
  processObj: any = {
    process: 0,
    status: '',
  };
  showProgress: boolean = false;

  errFormat: string = '';
  sizeTip: boolean = false;
  fileType: string = `.docx,.pptx,.pdf,.txt,.vtt,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm`;
  audioTypes = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
  uploadBtnState: ClrLoadingState = ClrLoadingState.DEFAULT;

  fetchSource: any;
  serverError: string = '';

  constructor(
    private service: SummarizeService,
    private _auth: AuthService
  ) {}

  ngOnInit(): void {}

  cancel() {
    this.uploadOutEmitter.emit(false);
  }

  btnClick() {
    this.serverError = '';
    this.showProgress = false;
    document.getElementById('inputFile')?.click();
  }

  fileBrowseHandler(target: any) {
    this.file = target.files[0];
    if (this.file) {
      this.sizeTip = false;
      this.errFormat = '';
      this.inputUpdateFileName = this.file.name;
      if (this.file && !this.isValidFile(this.file)) {
        this.errFormat = `Invalid format, only support ${this.fileType}`;
        return;
      }
      if (this.file && !this.isValidFileSize(this.file)) {
        this.sizeTip = !this.isValidFileSize(this.file);
        return;
      }
      this.processObj = {
        process: 0,
        status: '',
      };
    }
    target.value = '';
  }

  isValidFile(file: any) {
    const endSuffix = file.name.substring(file.name.lastIndexOf('.'));
    const fileTypes = this.fileType.split(',');
    return fileTypes.includes(endSuffix);
  }

  isValidFileSize(file: any): boolean {
    return file.size < MAX_SIZE ? true : false;
  }

  upload() {
    this.serverError = '';
    this.showProgress = true;
    this.uploadBtnState = ClrLoadingState.LOADING;

    const file = this.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;
    const uploadChunk = (start: number, end: number) => {
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('doc', chunk, file.name);
      formData.append('chunk', String(currentChunk));
      formData.append('total_chunks', String(totalChunks));
      this.service
        .uploadFile(
          formData,
          // this.userService.user()?.token?.refresh_token
        )
        .pipe(finalize(() => {}))
        .subscribe(
          () => {
            currentChunk++;
            if (currentChunk < totalChunks) {
              this.processObj.process = Math.floor(
                (currentChunk / totalChunks) * 100
              );
              const nextStart = currentChunk * CHUNK_SIZE;
              const nextEnd = Math.min(
                (currentChunk + 1) * CHUNK_SIZE,
                file.size
              );
              uploadChunk(nextStart, nextEnd);
            } else {
              this.processObj.process = 100;
              this.uploadBtnState = ClrLoadingState.DEFAULT;
              this.uploadOutEmitter.emit(true);
              if (
                this.audioTypes.includes(
                  this.file.name.substring(this.file.name.lastIndexOf('.'))
                )
              ) {
                this.audioToVtt();
              }
            }
          },
          (error: any) => {
            this.uploadBtnState = ClrLoadingState.DEFAULT;
            this.serverError =
              error.error.message || 'Server error, please try again late.';
            console.log('upload failed', error.error.message);
          }
        );
    };
    uploadChunk(0, CHUNK_SIZE);
  }

  audioToVtt() {
    this.processObj.process = 0;
    this.processObj.status = '';
    const formData = new FormData();
    formData.append('doc', this.file.name);
    this.service.audioToVtt(formData).subscribe(
      () => {
        console.log("everything's good audioToVtt");
      },
      (error: any) => {
        console.error('Error:', error);
      }
    );
  }
}
