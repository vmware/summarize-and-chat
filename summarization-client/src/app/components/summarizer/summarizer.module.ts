/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientModule } from '@angular/common/http';
import { SummarizerRoutingModule } from './summarizer-routing.module';
import { SummarizeDocComponent } from './summarize-doc/summarize-doc.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { SummarizeCollapseComponent } from './summarize-params/summarize-params.component';
import { SumTimeRangeComponent } from './sum-time-range/sum-time-range.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { PageRangeComponent } from './page-range/page-range.component';
import { MutliFileComponent } from './mutli-file/mutli-file.component';

registerLocaleData(zh);
@NgModule({
  declarations: [
    SummarizeDocComponent,
    UploadFileComponent,
    SummarizeCollapseComponent,
    SumTimeRangeComponent,
    PageRangeComponent,
    MutliFileComponent,
  ],
  imports: [
    CommonModule,
    SummarizerRoutingModule,
    ClarityModule,
    CdsModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    HttpClientModule,
    NgxDocViewerModule,
    NgxExtendedPdfViewerModule,
    NzButtonModule,
    NzTimePickerModule,
  ],
})
export class SummarizerModule {}
