# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import os, requests
import pickle
import datetime
from pathlib import Path
from werkzeug.utils import secure_filename

from fastapi import APIRouter, BackgroundTasks
from fastapi import Depends, UploadFile, Form
from fastapi.responses import FileResponse

from src.services.auth import *
from src.model.file_type import validate_audio
from src.utils.file import get_vtt, remove_file, get_user_files
from src.model.file_type import get_file_type, save_file, validate_audio, validate_doc, vtt_file
from src.utils.env import _env
from src.utils.summary_store import get_summary_history
from src.db.pgvector_db import pgvectorDB

from src.config import logger
from src.db.database import DocumentDB, ChatDB

server_config = _env.get_server_values()
pg_config = _env.get_db_values()
documentDB = DocumentDB(pg_config)
chatDB = ChatDB(pg_config)

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/upload")
async def upload(doc: UploadFile,
                 background_tasks:BackgroundTasks,
                 chunk: int = Form(),
                 total_chunks: int = Form(...),
                 user=Depends(verify_token),
                 ):
    if not doc or doc.size == 0:
        return ErrorResponse('not send file', 400)
    elif doc.size > 50 * 1024 * 1024:
        return ErrorResponse('document size max 50M', 400)

    email = user.username
    doc_path = await save_file(doc, chunk, total_chunks, email)
    name = secure_filename(doc.filename)
    
    # if doc upload finished, init doc index and run in background
    doc_id = await documentDB.add_document(str(doc_path), email)
    if doc_path.exists() and not validate_audio(name):
        background_tasks.add_task(pgvectorDB.vector_index, str(doc_path), email, doc_id, str(doc_path) )
        
    # if audio file upload finished,start convert task auto
    if doc_path.exists() and validate_audio(name):
        # use the audio gpu service to do convert
        stt_config = _env.get_stt_values()
        try:
            logger.info(f'--call audio service f"{stt_config["STT_API"]}/convert/audio/vtt" --')
            access_token = stt_config['AUTH_KEY'] 
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            data = {
                "audio": name,
                "user": email,
                "env": _env.get_env()
            }
            logger.info(f'---data--{data}')
            response = requests.post(f"{stt_config['STT_API']}/convert/audio/vtt", json=data, headers=headers)
            logger.info(response)
        except Exception as e:
            logger.error(f'--call audio gpu service error:{e}')

    return {"code": 200, "data": name}

@router.get("/file")
async def loadfile(user: str, filename: str):
    filename = secure_filename(filename)
    # file_path = Path(f"{config['FILE_PATH']}/{user.split('@')[0]}/{filename}")
    file_path = Path(f"{server_config['FILE_PATH']}/{user}/{filename}")

    if not file_path.exists():
        return ErrorResponse('file not found', 404)
    file_type = get_file_type(filename)
    if file_type.pdf is True:
        media_type = "application/pdf"
    elif file_type.txt is True:
        media_type = "text/plain"
    elif filename.endswith('.doc'):
        media_type = "application/msword"
    elif filename.endswith('.docx'):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith('.ppt'):
        media_type = "application/vnd.ms-powerpoint"
    elif filename.endswith('.pptx'):
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    elif filename.endswith('.vtt'):
        media_type = "text/plain"

    return FileResponse(file_path, media_type=media_type, headers={"Cache-Control": "no-cache, max-age=0"})


@router.get("/download")
async def download(user: str, filename: str):
    filename = secure_filename(filename)
    file_path = Path(f"{server_config['FILE_PATH']}/{user}/{filename}")
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")

@router.get("/files")
async def files(token=Depends(verify_token)):
    user = token.username
    all = get_user_files(user)
    vtts = []
    result = []
    index = 'in progress'
    for f in all:
        vtt_name = ''
        meta = {}
        doc_meta_path = Path(f"{server_config['FILE_PATH']}/{token.username}/metadata/{f.name}.pkl")
        if os.path.exists(doc_meta_path):
            meta = pickle.load(open(doc_meta_path, "rb"))
            
        modified_time = f.stat().st_mtime
        modified_datetime = datetime.datetime.fromtimestamp(modified_time)
        time = modified_datetime.strftime("%Y-%m-%d %H:%M:%S")
        if validate_audio(f.name):
            summary_type = 'meeting'
            vtt = get_vtt(f, token.username)
            status = 'in progress'
            if vtt.exists():
                vtt_name = vtt.name
                modified_time = vtt.stat().st_mtime
                modified_datetime = datetime.datetime.fromtimestamp(modified_time)
                time = modified_datetime.strftime("%Y-%m-%d %H:%M:%S")
                status = 'done'
                vtts.append(vtt_name)
        else:
            status = 'done'
            if f.name.endswith('.vtt'):
                summary_type = 'meeting'
                vtt_name = f.name
            else:
                summary_type = 'document'

        # get index status
        index = await pgvectorDB.index_status(str(f), user)

        # get file summary history
        summary = get_summary_history(user, f.name)

        # upload chunk file not show
        if f.name.rfind('.part') == -1:
            result.append({'file': f.name,
                           'vtt': vtt_name,
                           'status': status,
                           'time': time,
                           'summary_type': summary_type,
                           'summary': summary,
                           'meta': meta,
                           'index': index})
    # clean the vtt files which have mapped to audio file
    result[:] = [r for r in result if r['file'] not in vtts]
    # logger.info(f'--result---{result}')
    # sorted by time
    result = sorted(result, key=lambda r: datetime.datetime.strptime(r['time'], "%Y-%m-%d %H:%M:%S"), reverse=True)
    return {'data': result}


@router.delete("/file")
async def remove(name: str, token=Depends(verify_token)):
    user = token.username
    file_path = Path(f"{server_config['FILE_PATH']}/{user}/{name}")
    logger.info(f'----delete doc---{file_path}---{user}---')
    doc = documentDB.get_document(str(file_path), user)
    if doc:
        doc_id = doc[0][0]
        documentDB.delete_document(doc_id)
        pgvectorDB.delete_index(str(file_path), user, str(doc_id))
    return remove_file(name, user)


@router.get("/summary-history")
async def summary_history(filename: str, token=Depends(verify_token)):
    filename = secure_filename(filename)
    history = get_summary_history(token.username, filename)
    return {'summary': history}


@router.get("/retrieval-history")
async def retrieval_history(filename: str, token=Depends(verify_token)):
    filename = secure_filename(filename)
    history = chatDB.get_retrieval_history(token.username, filename)
    historyList = []
    for h in history:
        historyList.append({"user_query": h[3], "assistant_answer": h[4], "create_time": h[5]})
    return {'history':  historyList}

@router.delete("/retrieval-history")
async def retrieval_history(filename: str, count: int, token=Depends(verify_token)):
    filename = secure_filename(filename)
    docs = chatDB.delete_retrieval_history(token.username, filename)
    return {'count': docs}


@router.get("/checkfile")
async def check_file(filename: str, token=Depends(verify_token)):
    filename = secure_filename(filename)
    file_path = Path(f"{server_config['FILE_PATH']}/{token.username}/{filename}")
    user = token.username
    status = 'in progress'
    index = 'in progress'
    meta = {}
    summary_type = ''
    time = ''
    doc_meta_path = Path(f"{server_config['FILE_PATH']}/{user}/metadata/{filename}.pkl")

    if doc_meta_path.exists():
        meta = pickle.load(open(doc_meta_path, "rb"))
    if validate_audio(filename):
        summary_type = 'meeting'
        vtt = get_vtt(file_path, user)
        status = 'in progress'
        if vtt.exists():
            vtt_name = vtt.name
            modified_time = vtt.stat().st_mtime
            modified_datetime = datetime.datetime.fromtimestamp(modified_time)
            time = modified_datetime.strftime("%Y-%m-%d %H:%M:%S")
            status = 'done'
    else:
        if filename.endswith('.vtt'):
            summary_type = 'meeting'
        else:
            summary_type = 'document'
            
     # get index status
    index = await pgvectorDB.index_status(str(file_path), user)
    data = {
        'status': status,
        'index': index,
        'time': time,
        'summary_type': summary_type,
        'meta': meta,
    }
    return {'data': data}