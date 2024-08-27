# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import uvicorn
from fastapi import FastAPI, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware

from src.config import logger
from src.utils.env import _env
from src.db.create_db import create_db
from src.routers.file import router as record_router
from src.routers.retrieval import router as retrieval_router
from src.routers.summarize import router as summarize_router
from src.routers.convert import router as convert_router
from src.routers.metadata import router as meta_router
from src.routers.multidoc import router as multi_router
from src.routers.model import router as model_router

app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# health checking
@app.get("/health")
async def health_check():
    return {"code": 200, "msg": datetime.now().strftime("%d-%m-%Y %H:%M:%S")}

app.include_router(summarize_router)
app.include_router(retrieval_router)
app.include_router(record_router)
app.include_router(convert_router)
app.include_router(meta_router)
app.include_router(multi_router)
app.include_router(model_router)

if __name__ == '__main__':
    server_config = _env.get_server_values()
    serverhost = str(server_config['HOST'])
    serverport = int(server_config['PORT'])

    create_db()

    uvicorn.run("main:app", host=serverhost, port=serverport, reload=False, log_level="info")

