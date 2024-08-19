/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesRoutingModule } from './files-routing.module';
import { FileListComponent } from './file-list/file-list.component';
import { ClarityModule } from '@clr/angular';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { FileEditComponent } from './file-edit/file-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [FileListComponent, FileUploadComponent, FileEditComponent],
  imports: [
    CommonModule,
    ClarityModule,
    FilesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class FilesModule {}
