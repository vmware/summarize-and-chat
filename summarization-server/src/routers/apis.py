# Copyright 2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter
from fastapi import Depends, UploadFile, Form
from langchain.schema import Document
from langchain_community.document_loaders import PyPDFLoader

from src.services.auth import verify_api_key, ErrorResponse
from src.config import logger
from src.utils.env import _env
from src.utils.format import response_format
from src.services.document import summarize_docs
from src.model.data_model import Content

config = _env.get_server_values()
llm_config = _env.get_llm_values()
modelName, modelVal = _env.get_default_model()

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/summarize")
async def summarize(c: Content):
    docs = [Document(page_content=c.text)]

    if not c.chunk_prompt:
        c.chunk_prompt = 'Write a concise summary.'
    if not c.final_prompt:
        c.final_prompt = 'Write a concise summary. Do not copy the structure from the provided context. Avoid repetition. '
    c.final_prompt = response_format(c.final_prompt, c.format, c.length)
    return await summarize_docs(docs, c.chunk_size, c.chunk_overlap, c.chunk_prompt, c.final_prompt,
                                    c.model, c.format, c.temperature, c.length,
                                    stream_mode=c.streaming)

