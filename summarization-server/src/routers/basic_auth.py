# Copyright 2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter, Body, Depends
from typing import Dict
from pydantic import BaseModel

from src.model.data_model import DBUser
from src.utils.env import _env
from src.db.database import UserDB
from src.utils.auth_utils import encode_password
from src.model.data_model import UserParams, LoginParams
from src.services.auth import basic_auth, ErrorResponse

pg_config = _env.get_db_values()
userDB = UserDB(pg_config)

router = APIRouter(
    prefix="/api/v1"
)

@router.post("/register")
async def register(data: UserParams):
    if not data.email or not data.password:
        return ErrorResponse('Missing email or password', 400)
    user = userDB.get_user_by_email(data.email.strip())
    if user:
        return ErrorResponse('User already exists', 400)
    user = userDB.add_user(data.fname, data.lname, data.email, data.password)
    if not user:
        return ErrorResponse('User registration failed', 401)
    else:
        return {'user': user}

@router.post("/login/basic")
async def login(data: LoginParams):
    if not data.email or not data.password:
        return ErrorResponse('Missing email or password', 400)
    try:
        auth_user = await basic_auth(data.email, data.password)
        print(auth_user)
        return {'auth_user': auth_user}
    except Exception as e:
        print(e)
        return ErrorResponse('Invalid username or password', 401)
    
    