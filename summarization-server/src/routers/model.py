from fastapi import APIRouter, Body, Depends
from src.services.auth import verify_token
from typing import Dict
from src.utils.env import _env

router = APIRouter(
    prefix="/api/v1"
)

@router.get("/models")
async def get_models(token=Depends(verify_token)):
    models = _env.get_models()
    return models

@router.get("/models/{model_name}")
async def get_model(model_name: str, token=Depends(verify_token)):
    model = _env.get_model(model_name)
    return _env.get_models()