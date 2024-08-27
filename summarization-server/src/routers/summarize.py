# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter
from fastapi import Depends, UploadFile, Form
from langchain.schema import Document
from langchain.document_loaders import UnstructuredWordDocumentLoader, PyPDFLoader, TextLoader, UnstructuredPowerPointLoader
from pathlib import Path
from werkzeug.utils import secure_filename
import os

from src.services.auth import verify_token, ErrorResponse
from src.config import logger
from src.utils.env import _env
from src.utils.loader import pdf_loader
from src.utils.format import read_vtt, docs_pages, pages_to_document, response_format
from src.services.chat import answer
from src.services.document import summarize_docs
from src.services.meeting import summarize_meeting
from src.model.file_type import get_file_type, save_file, validate_audio, validate_doc, vtt_file
from src.model.data_model import Content,Question,Format,Length,Template

config = _env.get_server_values()
llm_config = _env.get_llm_values()
modelName, modelValue = _env.get_default_model() 

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/chat")
async def chat(q: Question, token=Depends(verify_token)):
    return await answer(q)


@router.post("/summarize-content")
async def summarize_content(c: Content, token=Depends(verify_token)):
    docs = [Document(page_content=c.text)]
    try:
        return await summarize_docs(docs, c.chunk_size, c.chunk_overlap, c.chunk_prompt, c.final_prompt,
                                c.model, c.format, c.temperature, c.length)
    except Exception as e:
        logger.error(f'summary error------{str(e)}')
        return ErrorResponse('Sorry,summarize server error, please ask the administrator for help!', 500)


@router.post("/summarize-doc")
async def summarize_document(doc: str = Form(),
                             chunk_size: int = Form(ge=1000, le=30000),
                             chunk_overlap: int = Form(ge=100, le=300),
                             start_page: int = Form(default=1, ge=1),
                             end_page: int = Form(default=1000, ge=1),
                             chunk_prompt: str = Form(),
                             final_prompt: str = Form(),
                             model: str = Form(modelName),
                             format: Format = Form(Format.auto),
                             temperature: float = Form(default=0, ge=0, le=1),
                             length: Length = Form(Length.auto),
                             start_time: str = Form(default='00:00:00'),
                             end_time: str = Form(default='02:00:00'),
                             template: Template = Form(Template.executive),
                             token=Depends(verify_token)):

    file_type = get_file_type(doc)
    filename = secure_filename(doc)
    docs = []
    doc_path = Path(f"{config['FILE_PATH']}/{token.username}/{filename}")
    if not doc_path.exists():
        return ErrorResponse('please upload your file first!', 400)
    if validate_doc(filename) is True:
        if os.path.exists(doc_path):
            file_type = get_file_type(filename)
            # summarize content by page
            try:
                if file_type.word is True:
                    loader = UnstructuredWordDocumentLoader(str(doc_path), mode="elements")
                    docs = docs_pages(loader.load(), start_page-1, end_page)
                    docs = pages_to_document(docs)
                elif file_type.pdf is True:
                    loader = pdf_loader(str(doc_path))
                    docs = loader.load()[start_page-1:end_page]
                    docs = pages_to_document(docs)
                elif file_type.ppt is True:
                    loader = UnstructuredPowerPointLoader(str(doc_path), mode="elements")
                    docs = docs_pages(loader.load(), start_page-1, end_page)
                    docs = pages_to_document(docs)
                elif file_type.txt is True:
                    loader = TextLoader(str(doc_path), autodetect_encoding=True)
                    docs = loader.load()
            except Exception as e:
                logger.error(e)
                return ErrorResponse('load document failed!', 400)
    elif file_type.vtt is True:
        docs = read_vtt(doc_path, start_time, end_time)
    elif validate_audio(filename) is True:
        vtt_path = vtt_file(filename, token.username)
        if os.path.exists(vtt_path) and os.path.getsize(vtt_path) > 1:
            docs = read_vtt(vtt_path, start_time, end_time)
        else:
            return ErrorResponse('Please convert your audio file to vtt file.', 400)
    else:
        return ErrorResponse('not support document type.', 400)

    if template is Template.executive:
        try:
            return await summarize_docs(docs, chunk_size, chunk_overlap, chunk_prompt, final_prompt,
                                        model, format, temperature, length,
                                        user=token.username, file_name=filename)
        except Exception as e:
            logger.error(f'summary error------{str(e)}')
            return ErrorResponse('Sorry,summarize server error, please ask the administrator for help!', 500)
    elif template is Template.meeting:
        # meeting not use the format and length
        try:
            return await summarize_meeting(docs, chunk_size, chunk_overlap, chunk_prompt, final_prompt,
                                        model, temperature,
                                        user=token.username, file_name=filename)
        except Exception as e:
            logger.error(f'summary error------{str(e)}')
            return ErrorResponse('Sorry,summarize server error, please ask the administrator for help!', 500)


@router.post("/summarize-meeting")
async def summarize_vtt(doc: str = Form(),
                    chunk_size: int = Form(ge=1000, le=30000),
                    chunk_overlap: int = Form(ge=100, le=300),
                    chunk_prompt: str = Form(),
                    start: str = Form(default='00:00:00'),
                    end: str = Form(default='02:00:00'),
                    final_prompt: str = Form(), token=Depends(verify_token)):

    file_type = get_file_type(doc)
    filename = secure_filename(doc)
    docs = []
    if file_type.vtt is True:
        doc_path = Path(f"{config['FILE_PATH']}/{token.username}/{filename}")
        if os.path.exists(doc_path):
            docs = read_vtt(doc_path, start, end)
        else:
            return ErrorResponse('please upload your file first!', 400)
    elif validate_audio(filename) is True:
        vtt_path = vtt_file(filename, token.username)
        if os.path.exists(vtt_path) and os.path.getsize(vtt_path) > 1:
            docs = read_vtt(vtt_path, start, end)
        else:
            return ErrorResponse('Please convert your audio file to vtt file.', 400)
    else:
        return ErrorResponse('not support document type.', 400)
    return await summarize_meeting(docs, chunk_size, chunk_overlap, chunk_prompt, final_prompt)


