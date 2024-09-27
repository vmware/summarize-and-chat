# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from src.config import logger
from fastapi import HTTPException, Depends
from starlette.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from src.utils.env import _env
from src.model.common import AuthenticatedUser
from src.db.database import UserDB
from src.utils.auth_utils import encode_password, generate_jwt_token

from okta_jwt.jwt import validate_token as validate_locally

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
auth_public_key = None

config = _env.get_okta_values()
pg_config = _env.get_db_values()
userDB = UserDB(pg_config)

# Define error response
def ErrorResponse(err: str, code=200):
    logger.error("Error: {}".format(err))
    resp = {'status': code, 'message': err}
    return JSONResponse(resp, status_code=code)

# Define the auth scheme and access token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')
async def okta_token_validate(token):
    OKTA_AUDIENCE="api://default"
    ISSUER = config["OKTA_AUTH_URL"]
    CLIENT_ID = config["OKTA_CLIENT_ID"]
    try:
        res = validate_locally(
            token,
            ISSUER,
            OKTA_AUDIENCE,
            CLIENT_ID
        )
        email = res.get('sub_email', "") if res else None
        user = AuthenticatedUser
        user.username = email
        user.access_token = token
        user.exp = res.get('exp', 0)
        return user
    except Exception:
        raise HTTPException(status_code=401)

# Verify okta token
async def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        token = await okta_token_validate(token)
    except:
        raise HTTPException(401, 'unAuthed', {"Authenticate": f"Bearer {token}"})
    return token

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
    secret_key = "121ba6ff-64d6-4c1a-b6ef-dd6b95433064"
    token = await generate_jwt_token(payload, secret_key)
    return {
        "token": token,
        "email": dbuser.email,
        "fname": dbuser.fname,
        "lname": dbuser.lname
    }


