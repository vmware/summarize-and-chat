import uvicorn
import argparse, json, time, re, string, random
from typing import  List, Union
from datetime import datetime

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.utils.logger import logger
from src.utils.env import stt_env
from src.routers import audio_router
from src.services.audio_service import TaskManager
from src.services.auth import AuthMiddleware, authservice

# setup loggers
TIMEOUT_KEEP_ALIVE = 5 # 5 seconds

app = FastAPI()

# health checking
@app.get("/health")
def health_check():
    return {"code": 200, "msg": datetime.now().strftime("%d-%m-%Y %H:%M:%S")}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    client_host = request.client.host if request.client else ''
    log_params = {
        "request_method": request.method,
        "request_url": str(request.url),
        "request_size": request.headers.get("content-length"),
        "request_headers": dict(request.headers),
        "response_status": response.status_code,
        "response_size": response.headers.get("content-length"),
        "response_headers": dict(response.headers),
        "process_time": process_time,
        "client_host": client_host
    }
    logger.info(str(log_params) + "\n")
    return response

app.include_router(audio_router.router)

@app.on_event("startup")
async def startup_event():
    task = TaskManager()
    task.start()

# start server
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STT API server.")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="host name")
    parser.add_argument("--port", type=int, default=9000, help="port number")
    parser.add_argument("--allow-credentials", action="store_true", help="allow credentials")
    parser.add_argument("--allowed-origins", type=json.loads, default=["*"], help="allowed origins")
    parser.add_argument("--allowed-methods", type=json.loads, default=["*"], help="allowed methods")
    parser.add_argument("--allowed-headers", type=json.loads, default=["*"], help="allowed headers")

    args = parser.parse_args()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=args.allowed_origins,
        allow_credentials=args.allow_credentials,
        allow_methods=args.allowed_methods,
        allow_headers=args.allowed_headers,
    )

    app.add_middleware(AuthMiddleware)
    
    server_config = stt_env.get_server_values()

    uvicorn.run(app,
        host=args.host,
        port=args.port,
        workers=int(server_config["SERVER_WORKERS"]),
        reload=bool(server_config["RELOAD"]),
        log_level="debug",
        access_log=False,
        timeout_keep_alive=TIMEOUT_KEEP_ALIVE)

    
    