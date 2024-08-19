/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {getObjTokenLength, getTokenLength, parseHttpErrorMsg } from 'src/app/utils/utils';

export class Model {
    name:string
    display_name:string
    max_token:number = 0
    max_chunk_size: number = 0
    chunk_overlap: number = 0

    constructor(data?:any) {
        this.name = data?.name || ""
        this.display_name = data?.display_name || ""
        this.max_token = Number(data?.max_token) || 0  
        this.max_chunk_size = this.max_token
        this.chunk_overlap = 100
    }
}

export interface UploadObj {
    progressFlag: boolean;
    uploadProgress: number;
}

export class ChatParameters {
    system_prompt:string = ""
    use_system_prompt:boolean = false
    rag_search_relevance_threshold:number = 0
    max_tokens:number = 0
    token_limit:number = 0
    temperature:number = 0
    enable_llamaguard:boolean = false

    constructor(data?:any) {
        this.system_prompt = data?.system_prompt 
        this.use_system_prompt = data?.use_system_prompt
        this.rag_search_relevance_threshold = data?.rag_search_relevance_threshold
        this.max_tokens = data?.max_tokens
        this.token_limit = data?.token_limit
        this.temperature = data?.temperature
        this.enable_llamaguard = data?.enable_llamaguard
    }
}


