import time, json, logging, httpx

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.requests import Request
from fastapi.security import OAuth2PasswordBearer
from okta_jwt.jwt import validate_token as validate_locally

from httpx import AsyncClient

from src.utils.env import stt_env
from src.utils.logger import logger
from src.models.common import User

NO_AUTH_ENDPOINTS = ["/health","/api/v1/health"]

class AuthService():
    def __init__(self):
        cfg = stt_env.get_auth_values(True)
        self.auth_enabled = cfg['ENABLED']
        self.auth_url = cfg['AUTH_URL']
        self.cache_timeout = cfg['CACHE_TIMEOUT']
        self.noauth_endpoints = NO_AUTH_ENDPOINTS
        # self.okta_endpoints = cfg['OKTA_ENDPOINTS']
        logger.info(self.__str__())
    
    def __str__(self):
        return f"[AUTH] {self.auth_url}"

    def get_token(self, request: Request):
        # Verify token is properly formatted
        auth_header = request.headers.get('Authorization')
        if not auth_header: 
            logger.info(request.url.path)
            raise HTTPException(status_code=401, detail="Authorization header is missing")
        if auth_header.startswith('Bearer '): return auth_header[7:]
        else: raise HTTPException(status_code=401, detail="Invalid authorization header")

    async def check_auth(self, token: str) -> bool:
        start_time = time.time()
        is_valid = await self.is_valid_token(token)

        elapsed_time = round(time.time() - start_time, 4)
        logger.info(f"{'Valid' if is_valid else 'Invalid'} Auth: took {elapsed_time} sec - {token}")
        return is_valid

    async def is_valid_token(self, token: str) -> bool:
        url = self.auth_url
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {"token": token}

        try:
            async with AsyncClient() as client:
                response = await client.post(url, headers=headers, data=data)
        except Exception as e:  
            logger.info(f"HTTP request error when checking if the token is valid: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error: Failed to validate the token.")

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Authorization failed: Invalid token.")

        response_data = response.json()
        return 'access_token' in response_data
            
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        try:
            cfg = stt_env.get_auth_values(True)
            auth_enabled = cfg['ENABLED']
            
            endpoint = request.url.path.rstrip('/')
            if not auth_enabled or endpoint in authservice.noauth_endpoints:
                print('no auth required')
                return await call_next(request)
            
            token = authservice.get_token(request)
            logger.info(f'token: {token}')
            await authservice.check_auth(token)
            response = await call_next(request)
            return response
        except HTTPException as e:
            logger.error(e.detail)
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})

authservice = AuthService()

