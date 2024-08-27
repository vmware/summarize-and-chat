# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel
from pathlib import Path
import os
from werkzeug.utils import secure_filename

from src.utils.env import _env

config = _env.get_server_values()

class FileType(BaseModel):
    word: bool = False
    txt: bool = False
    pdf: bool = False
    vtt: bool = False
    mp4: bool = False
    m4a: bool = False
    mp3: bool = False
    wav: bool = False
    webm: bool = False
    mpeg: bool = False
    mpga: bool = False
    ppt: bool = False

def get_file_type(filename: str) -> FileType:
    file_type = FileType()
    if filename.endswith('.doc') or filename.endswith('.docx'):
        file_type.word = True
    elif filename.endswith('.txt'):
        file_type.txt = True
    elif filename.endswith('.pdf'):
        file_type.pdf = True
    elif filename.endswith('.vtt'):
        file_type.vtt = True
    elif filename.endswith('.mp4'):
        file_type.mp4 = True
    elif filename.endswith('.m4a'):
        file_type.m4a = True
    elif filename.endswith('.mp3'):
        file_type.mp3 = True
    elif filename.endswith('.ppt'):
        file_type.ppt = True
    elif filename.endswith('.pptx'):
        file_type.ppt = True
    return file_type


def validate_audio(filename: str):
    if filename.endswith('.mp4'):
        return True
    elif filename.endswith('.mp3'):
        return True
    elif filename.endswith('.m4a'):
        return True
    elif filename.endswith('.wav'):
        return True
    elif filename.endswith('.webm'):
        return True
    elif filename.endswith('.mpeg'):
        return True
    elif filename.endswith('.mpga'):
        return True
    else:
        return False


def validate_doc(filename: str):
    if filename.endswith('.docx'):
        return True
    elif filename.endswith('.doc'):
        return True
    elif filename.endswith('.txt'):
        return True
    elif filename.endswith('.pdf'):
        return True
    elif filename.endswith('.ppt'):
        return True
    elif filename.endswith('.pptx'):
        return True
    else:
        return False


def vtt_file(filename, user):
    name = filename.split(".")[-1]
    vtt_name = filename.replace(name, 'vtt')
    parent_path = Path(f"{config['FILE_PATH']}/{user}")
    vtt_path = Path(f"{parent_path}/{vtt_name}")
    return vtt_path


async def save_file(file, chunk, total_chunks, user):
    filename = secure_filename(file.filename)
    parent_path = Path(f"{config['FILE_PATH']}/{user}")
    save_path = Path(f"{parent_path}/{filename}")
    if os.path.exists(save_path):
        return save_path
    if not os.path.exists(parent_path):
        os.makedirs(parent_path)

    # save chunk part
    save_chunk_path = Path(f"{parent_path}/{filename}.part{chunk}")
    with open(save_chunk_path, 'wb') as f:
        f.write(await file.read())

    # combin all chunk to one file
    if chunk == total_chunks - 1:
        with open(save_path, 'wb') as f:
            for i in range(total_chunks):
                chunk_path = Path(f"{parent_path}/{filename}.part{i}")
                with open(chunk_path, 'rb') as chunk_file:
                    f.write(chunk_file.read())
                chunk_path.unlink()

    return save_path