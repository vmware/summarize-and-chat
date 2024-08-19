/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SummarizeService } from 'src/app/services/summarize.service';
import { SummarizeParamsService } from '../services/summarize-params.service';

const CHUNK_SIZE = 2 * 1024 * 1024;
const MAX_SIZE = 200 * 1024 * 1024;

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
})
export class UploadFileComponent implements OnInit {
  @Input() file: any;
  @Input() fileType: any;
  @Input() uploadProgress: number = 0;
  @Input() progressFlag: boolean = false;
  @Output('outFile') outFileEmitter = new EventEmitter();
  @Input() loading: boolean = false;

  files: any[] = [];
  errFormat: string = '';
  sizeTip: boolean = false;

  constructor(
    private service: SummarizeService,
    private summarizeParamsService: SummarizeParamsService,
    private _auth: AuthService
  ) {}

  ngOnInit(): void {}

  /**
   * handle file from browsing
   */
  fileBrowseHandler(target: any) {
    this.errFormat = '';
    this.files = [...target.files];
    this.file = this.files[0];
    if (this.file && !this.isValidFile(this.file)) {
      this.errFormat = `Invalid format, only support ${this.fileType}`;
      return;
    }
    if (this.file && !this.isValidFileSize(this.file)) {
      this.sizeTip = !this.isValidFileSize(this.file);
      return;
    }
    this.outFileEmitter.emit(this.files);
    this.handleFileUpload(this.file);
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

  deleteFile() {
    this.uploadProgress = 0;
    this.progressFlag = false;
    this.files = [];
    this.file = '';
    let obj = {
      file: this.file,
      type: 'close',
    };
    this.outFileEmitter.emit(obj);
  }

  formatBytes(bytes: any, decimals?: any) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  handleFileUpload(file: File): void {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;
    this.progressFlag = true;
    this.summarizeParamsService.updateData({
      progressFlag: this.progressFlag,
      uploadProgress: this.uploadProgress,
    });
    const uploadChunk = (start: number, end: number) => {
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('doc', chunk, file.name);
      formData.append('chunk', String(currentChunk));
      formData.append('total_chunks', String(totalChunks));

      this.service
        .uploadFile(
          formData,
          // this.userService.loggedUser()?.token?.refresh_token
        )
        .pipe(finalize(() => {}))
        .subscribe(
          () => {
            currentChunk++;
            if (currentChunk < totalChunks) {
              this.uploadProgress = Math.floor(
                (currentChunk / totalChunks) * 100
              );
              const nextStart = currentChunk * CHUNK_SIZE;
              const nextEnd = Math.min(
                (currentChunk + 1) * CHUNK_SIZE,
                file.size
              );
              if (this.progressFlag) {
                this.summarizeParamsService.updateData({
                  progressFlag: this.progressFlag,
                  uploadProgress: this.uploadProgress,
                });
                uploadChunk(nextStart, nextEnd);
              }
            } else {
              this.uploadProgress = 100;
              this.progressFlag = false;
              this.summarizeParamsService.updateData({
                progressFlag: this.progressFlag,
                uploadProgress: this.uploadProgress,
              });
            }
          },
          (error) => {
            console.error('upload failed', error);
          }
        );
    };

    uploadChunk(0, CHUNK_SIZE);
  }
}
