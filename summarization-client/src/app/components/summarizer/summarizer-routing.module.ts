/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SummarizeDocComponent } from './summarize-doc/summarize-doc.component';
import { MutliFileComponent } from './mutli-file/mutli-file.component';

const routes: Routes = [
  { path: 'doc', component: SummarizeDocComponent },
  { path: 'summarizeMutFile', component: MutliFileComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SummarizerRoutingModule {}