import requests
import concurrent.futures
import threading
import os
from faster_whisper import WhisperModel

from datetime import datetime  
from pathlib import Path
from queue import Queue
from pydub import AudioSegment

from src.utils.env import stt_env
from src.utils.logger import logger
from src.utils.common import convert_seconds_to_hms, file_write
from src.services.summerization_service import notification_summerization_service

TASK_QUEUE = Queue()
ACTIVE_TASKS = []

server_config= stt_env.get_server_values()
model_config = stt_env.get_model_values()
thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=int(server_config["MAX_WORKS"] if server_config else 3))


def process_task(audio_path: Path, vtt_path: Path, user: str, env: str, token):
    logger.info(f'process_task {vtt_path}')
    print('----------token=', token)
    global TASK_QUEUE, ACTIVE_TASKS

    try:
        if str(audio_path) not in ACTIVE_TASKS:
            ACTIVE_TASKS.append(str(audio_path))
            audio_to_vtt_file(audio_path, vtt_path, env)
            notification_summerization_service(vtt_path, audio_path, env, token, user)
    except Exception as e:
        submit_task(audio_path, vtt_path, user, env, token)
        logger.error(f'AUDIO-TO-VTT ERROR: {str(e)}')
    finally:
        logger.info(f'process_task is done {vtt_path}')
        ACTIVE_TASKS.remove(str(audio_path))

def audio_to_vtt_file(audio_path, vtt_path, env="prod", model_size_or_path=model_config["MODEL_SIZE"], compute_type=model_config["COMPUTE_TYPE"]):
    current_time = datetime.now()
    logger.info(f'AUDIO-TO-VTT START: {current_time} audio_path:{audio_path}')
    
    model_path = stt_env.get_model_path()
    model = WhisperModel(
                model_size_or_path=model_size_or_path, 
                device=model_config["DEVICE"], 
                device_index=list(range(int(model_config["DEVICE_INDEX"]))),
                compute_type=compute_type, 
                cpu_threads=int(server_config["CPU_THREADS"]),
                num_workers=int(server_config["NUM_WORKERS"]),
                download_root=model_path
            )
    logger.debug(f'AUDIO-TO-VTT load model done {str(model)}')
    # filter out parts of the audio without speech
    segments, info = model.transcribe(str(audio_path), vad_filter=True)
    logger.debug(f'AUDIO-TO-VTT vad_filter done {str(segments)} {str(info)}')
    
    # audio time
    sound = AudioSegment.from_file(str(audio_path))
    audio_time, part, progress = len(sound)/1000, 0, 0
    vtt_process_text = Path(str(vtt_path).replace('.vtt', '.txt'))
    
    logger.info(f'AUDIO-TO-VTT transforming to vtt file')
    file_write(vtt_path, "WEBVTT\n\n") #write vtt file header WEBVTT
    for segment in segments:
        duration = f"{convert_seconds_to_hms(segment.start)} --> {convert_seconds_to_hms(segment.end)}\n"
        result = "{:.2f}".format(round(segment.end / audio_time, 2))
        progress = float(result) if float(result) < 1 else 1
        text = segment.text.strip() + '\n\n'
        part += 1
        line = str(part) + "\n" + duration + text
        
        file_write(vtt_process_text, str(progress)) #write progress
        file_write(vtt_path, line, 'a') #append write vtt data

    logger.info(f'AUDIO-TO-VTT VTT_FILE: {vtt_path} UNLINK:{vtt_process_text}')
    vtt_process_text.unlink()
    
    logger.info(f'AUDIO-TO-VTT DONE: {datetime.now()} DURATION: {datetime.now() - current_time}')
    return vtt_path

def submit_task(audio_path: Path, vtt_path: Path, user: str, env: str, token):
    global TASK_QUEUE, ACTIVE_TASKS
    task = {'audio_path': audio_path, 'vtt_path': vtt_path, 'user': user, 'env': env, 'token': token}
    TASK_QUEUE.put(task)
    return {'status': 'success', 'message': 'audio into convert queue'}

def task_process(audio: str, env, user: str):
    name = f'.{audio.split(".")[-1]}'
    vtt_name = audio.replace(name, '.vtt')
    FILE_PATH = server_config["FILE_PATH"] #stt_env.get_path(env)
    vtt_path = Path(f"{FILE_PATH}/{user}/{vtt_name}")
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

class TaskManager(threading.Thread):
    def run(self, *args, **kwargs):
        while True:
            try:
                global TASK_QUEUE, ACTIVE_TASKS
                logger.info(f"TASK QUEUE STARTING")
                task = TASK_QUEUE.get()
                audio_path, vtt_path, user, env, token = task['audio_path'], task['vtt_path'], task['user'], task['env'], task['token']
                thread_pool.submit(lambda: process_task(audio_path, vtt_path, user, env, token))
                logger.info(f"TASK QUEUE SUBMIT")
            except:
                logger.error(f'TASK QUEUE ERROR')