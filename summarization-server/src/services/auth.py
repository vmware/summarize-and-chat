# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from src.config import logger
from fastapi import HTTPException, Depends
from starlette.responses import JSONResponse
from starlette.requests import Request
from fastapi.security import OAuth2PasswordBearer
from src.utils.env import _env
from src.model.common import AuthenticatedUser
from src.db.database import UserDB
from src.utils.auth_utils import encode_password, generate_jwt_token

from okta_jwt.jwt import validate_token as validate_locally

import jwt

server_config = _env.get_server_values()
secret_key = server_config['JWT_SECRET_KEY']
api_key = server_config['API_KEY']

config = _env.get_okta_values()
pg_config = _env.get_db_values()
userDB = UserDB(pg_config)

# Define error response
def ErrorResponse(err: str, code=200):
    logger.error("Error: {}".format(err))
    resp = {'status': code, 'message': err}
    return JSONResponse(resp, status_code=code)

def get_token(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header: 
        raise HTTPException(status_code=401, detail="Authorization header is missing")
    if auth_header.startswith('Bearer '): return auth_header[7:]
    else: raise HTTPException(status_code=401, detail="Invalid authorization header")


# Verify okta token
async def verify_token(token: str = Depends(get_token)):
    try:
        res = jwt.decode(token, secret_key, algorithms=["HS256"])
        user = AuthenticatedUser
        user.username = res['email']
        return user
    except Exception as e:
        print(e)
        raise HTTPException(401, 'unAuthed', {"Authenticate": f"Bearer {token}"})
    return token

async def verify_api_key(key: str):
    print('key=',key)
    if api_key is None:
        return True
    if key is None or key == '' or key != api_key:
        raise HTTPException(401, 'unAuthed', {"Authenticate": f"Bearer {key}"})
        
    return True

async def basic_auth(email: str, password: str):
    if not email or not password:
        return HTTPException(401, 'unAuthed', 'Missing email or password')
    dbuser = userDB.get_user_by_email(email)
    if not dbuser:
        return HTTPException(401, 'unAuthed', 'User not found')
    if dbuser.password != encode_password(password):
        return HTTPException(401, 'unAuthed', 'Wrong user name or password')

    payload = {
        'id': dbuser.getId(),
        'email': dbuser.getEmail(),
        'fname': dbuser.getFirstName(),
        'lname': dbuser.getLastName()
    }
   
    token = await generate_jwt_token(payload, secret_key)
    return {
        "token": token,
        "email": dbuser.email,
        "fname": dbuser.fname,
        "lname": dbuser.lname
    }


