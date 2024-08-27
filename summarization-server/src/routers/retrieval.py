# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.services.auth import verify_token, ErrorResponse
from src.config import logger
from src.services.retrieverdoc import questions, llmaindex_rag

router = APIRouter(
    prefix="/api/v1"
)

@router.get("/questions")
async def question_generate(filename: str, token=Depends(verify_token)):
    logger.info(f'----question_generate---{filename}---')
    return questions(filename, token.username)

class Rag(BaseModel):
    file: str
    query: str

@router.post("/retrieval")
async def retrieval_doc(data:Rag, token=Depends(verify_token)):
    try:
        answer = await llmaindex_rag(data.query, token.username, data.file)
        return answer
    except AssertionError:
        return ErrorResponse('Sorry,we have changed embedding model, please delete your document and upload again.', 500)
    except Exception as e:
        logger.error(f'retrieval error------{str(e)}')
        return ErrorResponse('Sorry,summarize server error, please ask the administrator for help!', 500)