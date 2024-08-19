import concurrent.futures
from queue import Queue
from werkzeug.utils import secure_filename
from faster_whisper import WhisperModel
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

def process_task(audio_path: Path, vtt_path: Path, user: str):
    global TASK_QUEUE, ACTIVE_TASKS
    try:
        logger.info(f'---audio to vtt----{audio_path}---{user}')
        if str(audio_path) not in ACTIVE_TASKS:
            if not vtt_path.exists():
                ACTIVE_TASKS.append(str(audio_path))
                # model_size = "large-v2"
                model_size = "small"
                # compute_type: int8_float16, int8
                model = WhisperModel(model_size, device="cpu", compute_type="int8", download_root="./cache")
                # local need manual download huggingface model to local
                # model = WhisperModel(model_size, device="cpu", compute_type="int8",cpu_threads=4,num_workers=4,download_root="D:\\code\\summarization-server\\DC")
                # filter out parts of the audio without speech
                segments, info = model.transcribe(str(audio_path), vad_filter=True)
                # audio time
                sound = AudioSegment.from_file(str(audio_path))
                audio_time = len(sound) / 1000
                part = 0
                progress = 0
                vtt_process_text = Path(str(vtt_path).replace('.vtt', '.txt'))
                vtt = 'WEBVTT\n\n'
                for segment in segments:
                    duration = f"{convert_seconds_to_hms(segment.start)} --> {convert_seconds_to_hms(segment.end)}\n"
                    result = "{:.2f}".format(round(segment.end / audio_time, 2))
                    progress = float(result)
                    if progress > 1:
                        progress = 1
                    text = segment.text.strip() + '\n\n'
                    part += 1
                    line = str(part) + "\n" + duration + text
                    vtt += line

                    # write process info
                    with open(str(vtt_process_text), 'w', encoding="utf-8") as file:
                        file.write(str(progress))

                # write vtt
                with open(str(vtt_path), 'w', encoding="utf-8") as file:
                    file.write(vtt)

                # delete process txt
                vtt_process_text.unlink()
                # send email and create vtt file index
                if vtt_path.exists():
                    try:
                        notify_vtt_finished(user, audio_path.name)
                        pgvectorDB.vector_index(vtt_path.name, user)
                    except Exception as e:
                        logger.error(str(e))
    except Exception as e:
        logger.error(str(e))
    finally:
        ACTIVE_TASKS.remove(str(audio_path))


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


class TaskManager(threading.Thread):
    def run(self, *args, **kwargs):
        while True:
            global TASK_QUEUE, ACTIVE_TASKS
            logger.info(f"------task queue starting--------")
            task = TASK_QUEUE.get()
            audio_path, vtt_path, user = task['audio_path'], task['vtt_path'], task['user']
            thread_pool.submit(lambda: process_task(audio_path, vtt_path, user))
