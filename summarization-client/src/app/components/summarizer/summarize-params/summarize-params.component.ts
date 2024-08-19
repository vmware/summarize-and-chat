/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
} from '@angular/core';

import { Store, select } from '@ngrx/store';

import { listToDict } from 'src/app/utils/utils'
import { Model } from 'src/app/models/model';
import { IAppState, getModels } from 'src/app/store/reducer';
import { SummarizeParamsService } from '../services/summarize-params.service';
import { SummarizeService } from 'src/app/services/summarize.service';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-summarize-params',
  templateUrl: './summarize-params.component.html',
  styleUrls: ['./summarize-params.component.scss'],
})
export class SummarizeCollapseComponent implements OnInit {
  @Input() chatCollapsed: boolean = false;
  @Input() uploadLoading!: boolean;
  @Input() editTemplate!: boolean;
  @Input() isShowFinal: boolean = true;
  @Input() showTimeRange: boolean = true;
  @Input() showPageRange!: boolean;
  @Input() showAlert: boolean = false;
  @Input() template: string = 'executive';
  @Input() len: string = 'auto';

  @Output('pageRangeData') pageRangeDataEmitter = new EventEmitter();
  @Output('rangeStartData') rangeStartDataEmitter = new EventEmitter();
  @Output('rangeEndData') rangeEndDataEmitter = new EventEmitter();

  showConfig: boolean = false;
  models: any = [];
  models_dict: any;
  selectedModel: Model;
  max_chunk_size: number = 30000;
  chunk_overlap: number = 100;

  rangDataObj: any = {
    startPage: 1,
    endPage: 50,
  };

  private _models$ = this._store.pipe(select(getModels));
  private subs: any[] = []
  configInfoObj: any

  constructor(
    private _store: Store<IAppState>,
    private summarizeParamsService: SummarizeParamsService,
    private config: ConfigService,
    private summarizeService: SummarizeService
  ) {
    this.selectedModel = new Model();
    this.selectedModel.name = 'mistralai/Mistral-7B-Instruct-v0.2'; // default model
    this.selectedModel.max_chunk_size = 30000;
    this.selectedModel.chunk_overlap = 100;
    
    this.summarizeService.getModels();
    this.subs.push(this._models$.subscribe(models => {
      this.models = models;
      console.log('models=', this.models);

      this.models_dict = Object.fromEntries(models.map(item => [item.name, {max_chunk_size: item.max_chunk_size, chunk_overlap: item.chunk_overlap}]));
      // console.log(this.models_dict)

      if (this.models.length > 0) {
        this.selectedModel = this.models[0];
      } 
      console.log('selectedModel=', this.selectedModel)
  
      this.configInfoObj = {
        chunkSizeVal: this.selectedModel.max_token,
        chunkOverlapVal: this.selectedModel.chunk_overlap,
        chunkPromptdes: 'Write a concise summary.',
        finalPromptDes: 'Write a concise summary. Do not copy the structure from the provided context. Avoid repetition.',
        format: 'paragraph',
        len: this.len ? this.len : 'auto',
        temperature: 0,
        template: 'executive',
        model: this.selectedModel.name
      };
      this.summarizeParamsService.updateParameters(this.configInfoObj);
      this.max_chunk_size = this.selectedModel.max_token;
      this.chunk_overlap = this.selectedModel.chunk_overlap;
    }))
  }

  ngOnInit(): void {
    if (!this.isShowFinal) {
      this.configInfoObj = {
        chunkSizeVal: this.selectedModel.max_token,
        chunkOverlapVal: this.selectedModel.chunk_overlap,
        chunkPromptdes: `Please help summarize those documents one by one. Format each one like this:
Document: document name
Over all: summarize result`,
        format: 'paragraph',
        len: 'medium',
        temperature: 0,
        template: 'executive',
        model: this.selectedModel.name, 
      };
    } else {
      if (this.template === 'meeting') {
        this.configInfoObj.chunkPromptdes =
          'Write a concise meeting summary,including the attendees(optional, if not provided from user context not give this info in your answer)';
        this.configInfoObj.finalPromptDes = `Write a final concise meeting summary include the attendees(optional, if not provided from user context not give this info in your answer), 3 key topics, 3 actions info, overall summary. Do not copy the structure from the provided summarizes. Avoid repetition. Format final summary as below:

Key topics: (top 3 key topic)
1.
2.
3.
Actions: (top 3 action)
1.
2.
3.
Attendees:
Overall:`;
        this.configInfoObj.template = 'meeting';
      }
    }
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  ngOnChanges(changes: SimpleChange | any) {
    this.len = changes['len']?.currentValue;
    if (this.len) {
      this.configInfoObj.len = this.len;
    }
  }

  maxChunkSize(model: any) {
    let obj = this.models_dict[model];
    return obj.max_chunk_size;
  }

  sizeRangeChange(event: any) {
    this.configInfoObj.chunkSizeVal = parseInt(event.target.value);
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  overLapRangeChange(event: any) {
    this.configInfoObj.chunkOverlapVal = parseInt(event.target.value);
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  temperatureChange(event: any) {
    this.configInfoObj.temperature = parseFloat(event.target.value);
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  numInputChange(type: string, min: number, max: number) {
    if (this.configInfoObj[type] < min) {
      this.configInfoObj[type] = min;
    }
    if (this.configInfoObj[type] > max) {
      this.configInfoObj[type] = max;
    }
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  finalPromptChange() {
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  formatChange(event: any) {
    this.configInfoObj.format = event;
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  lenChange(event: any) {
    this.configInfoObj.len = event;
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  modelChange(event: Model) {
    this.configInfoObj.model = event;
    let maxChunk = this.maxChunkSize(event); 
    if (this.configInfoObj.chunkSizeVal > maxChunk) {
      this.configInfoObj.chunkSizeVal = maxChunk;
    }
    this.max_chunk_size = maxChunk;
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  changeConfig(event: any) {
    this.showConfig = event?.target?.value === 'detailed';
  }

  templateChange(event: any) {
    this.template = event;
    this.setConfig();
  }

  setConfig() {
    if (this.template == 'executive') {
      this.configInfoObj.chunkPromptdes =
        'Write a concise summary. Do not copy the structure from the provided context. Avoid repetition.';
      this.configInfoObj.finalPromptDes =
        'Write a concise summary. Do not copy the structure from the provided context. Avoid repetition.';
      this.configInfoObj.template = 'executive';
    } else {
      this.configInfoObj.chunkPromptdes =
        'Write a concise meeting summary,include the attendees(optional, if not provided from user context not give this info in your answer)';
      this.configInfoObj.finalPromptDes = `Write a final concise meeting summary include the attendees(optional, if not provided from user context not give this info in your answer), 3 key topics, 3 actions info, overall summary. Do not copy the structure from the provided summarizes. Avoid repetition. Format final summary as below:

Key topics: (top 3 key topic)
1.
2.
3.
Actions: (top 3 action)
1.
2.
3.
Attendees:
Overall:`;
      this.configInfoObj.template = 'meeting';
    }
    this.summarizeParamsService.updateParameters(this.configInfoObj);
  }

  getPageRangeData(obj: any) {
    this.rangDataObj = obj;
    this.pageRangeDataEmitter.emit(this.rangDataObj);
  }

  rangeStartData(event: any) {
    this.rangeStartDataEmitter.emit(event);
  }

  rangeEndData(event: any) {
    this.rangeEndDataEmitter.emit(event);
  }
}
