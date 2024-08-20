from src.config import logger
from fastapi import HTTPException, Depends
from starlette.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from src.utils.env import _env
from src.model.common import *
# from src.services.api_auth import apiAuth
import time

from okta_jwt.jwt import validate_token as validate_locally

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
auth_public_key = None

config = _env.get_okta_values()

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
        user = User
        user.username = email
        user.access_token = token
        user.exp = res.get('exp', 0)
        return user
    except Exception:
        raise HTTPException(status_code=401)

# Verify token
async def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        token = await okta_token_validate(token)
    except:
        raise HTTPException(401, 'unAuthed', {"Authenticate": f"Bearer {token}"})
    return token


