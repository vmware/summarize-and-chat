# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter, Depends
from pathlib import Path
from werkzeug.utils import secure_filename

from src.services.auth import verify_token, ErrorResponse
from src.services.analyzes import multi_document_analyze
from src.utils.env import _env
from src.model.data_model import Multi

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/analyze")
async def multi_document(data: Multi, token=Depends(verify_token)):
    filetype = []
    config = _env.get_server_values()
    for f in data.file:
        filename = secure_filename(f)
        doc_path = Path(f"{config['FILE_PATH']}/{token.username}/{filename}")
        if not doc_path.exists():
            return ErrorResponse(f'please upload your {f} first!', 400)
        else:
            type = f.split('.')[-1]
            if type not in filetype:
                filetype.append(type)

    return await multi_document_analyze(data, token.username)
