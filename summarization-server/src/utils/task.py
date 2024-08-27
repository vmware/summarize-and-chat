# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import concurrent.futures
from queue import Queue
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import threading
from pathlib import Path
from src.utils.file import convert_seconds_to_hms
from src.utils.email import notify_vtt_finished
from src.config import logger
from src.utils.env import _env
from src.db.pgvector_db import pgvectorDB

TASK_QUEUE = Queue()
ACTIVE_TASKS = []
thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=5)

config = _env.get_server_values()

def submit_task(audio_path: Path, vtt_path: Path, user: str):
    global TASK_QUEUE, ACTIVE_TASKS
    task = {'audio_path': audio_path, 'vtt_path': vtt_path, 'user': user}
    TASK_QUEUE.put(task)
    return {'status': 'success', 'message': 'audio into convert queue'}


def task_process(audio: str, user: str):
    name = f'.{audio.split(".")[-1]}'
    vtt_name = audio.replace(name, '.vtt')
    vtt_path = Path(f"{config['FILE_PATH']}/{user}/{vtt_name}")
    process = 0
    if vtt_path.exists():
        process = 1
    else:
        process_file = Path(str(vtt_path).replace('.vtt', '.txt'))
        if process_file.exists():
            with open(str(process_file), 'r') as file:
                content = file.read()
                process = float(content)
    return {'process': process}


def task_status():
    global ACTIVE_TASKS, TASK_QUEUE
    return {'tasks': ACTIVE_TASKS, 'queues': len(TASK_QUEUE.queue)}


# class TaskManager(threading.Thread):
#     def run(self, *args, **kwargs):
#         while True:
#             global TASK_QUEUE, ACTIVE_TASKS
#             logger.info(f"------task queue starting--------")
#             task = TASK_QUEUE.get()
#             audio_path, vtt_path, user = task['audio_path'], task['vtt_path'], task['user']
#             thread_pool.submit(lambda: process_task(audio_path, vtt_path, user))
