from fastapi import APIRouter, Body, Depends
from typing import Dict
from pydantic import BaseModel
from pathlib import Path
import pickle
import os

from src.utils.env import _env
from src.services.auth import verify_token, ErrorResponse

router = APIRouter(
    prefix="/api/v1"
)

class Metadata(BaseModel):
    file: str
    meta: Dict[str, str] = Body(...)

@router.post("/metadata")
async def metadata(data: Metadata, token=Depends(verify_token)):
    config = _env.get_server_values()
    doc_path = Path(f"{config['FILE_PATH']}/{token.username}/{data.file}")
    doc_meta_path = Path(f"{config['FILE_PATH']}/{token.username}/metadata/{data.file}.pkl")
    if os.path.exists(doc_path):
        if not os.path.exists(doc_meta_path):
            doc_meta_path.parent.mkdir(parents=True, exist_ok=True)
        pickle.dump(data.meta, open(doc_meta_path, "wb"))
    else:
        return ErrorResponse('please upload your file first!', 400)
    return data