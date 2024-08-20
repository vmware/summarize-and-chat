from fastapi import APIRouter, Request, HTTPException, Depends

import os
from pathlib import Path
from werkzeug.utils import secure_filename
from datetime import datetime

from src.services import audio_service
import src.utils.audio as audio_utils
from src.utils.logger import logger
from src.models.common import AudioInfo
from src.utils.env import stt_env
from src.services.auth import authservice

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/convert/audio/vtt")
async def audio_to_vtt(request: Request, audio: AudioInfo):
    filename = secure_filename(audio.audio)
    server_config= stt_env.get_server_values()
    FILE_PATH = server_config["FILE_PATH"] #stt_env.get_path()
    audio_path = Path(f"{FILE_PATH}/{audio.user}/{filename}")
    vtt_path = await audio_utils.vtt_file(filename, audio.user, audio.env)
    
    if not os.path.exists(audio_path):
        return HTTPException(status_code=404, detail=[{"msg": f"file not found"}])
    if os.path.exists(vtt_path):
        return HTTPException(status_code=200, detail=[{"msg": f"vtt file already exist"}])  
    if await audio_utils.validate_audio(filename) is False:
        return HTTPException(status_code=400, detail=[{"msg": f"file type not support"}])
    
    token = authservice.get_token(request)
    return audio_service.submit_task(audio_path, vtt_path, audio.user, audio.env, token)

@router.get("/convert/audio/vtt/progress")
async def get_process(request: Request, audio: str, env: str):
    token = authservice.get_token(request)
    return audio_service.task_process(audio, env, token.username)


@router.get("/task-status")
async def get_task_status(request: Request):
    return audio_service.task_status()