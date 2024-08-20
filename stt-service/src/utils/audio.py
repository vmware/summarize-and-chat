import math,os

from pathlib import Path
from werkzeug.utils import secure_filename
from src.utils.env import stt_env

def convert_seconds_to_hms(seconds):
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = math.floor((seconds % 1) * 1000)
    output = f"{int(hours):02}:{int(minutes):02}:{int(seconds):02},{milliseconds:03}"
    return output

async def validate_audio(audio: str):
    filename = secure_filename(audio)
    if filename.endswith('.mp4'):
        return True
    elif filename.endswith('.mp3'):
        return True
    elif filename.endswith('.m4a'):
        return True
    elif filename.endswith('.wav'):
        return True
    elif filename.endswith('.webm'):
        return True
    elif filename.endswith('.mpeg'):
        return True
    elif filename.endswith('.mpga'):
        return True
    else:
        return False
    
async def vtt_file(filename, user, env):
    name = filename.split(".")[-1]
    vtt_name = filename.replace(name, 'vtt')
    server_config= stt_env.get_server_values()
    FILE_PATH = server_config["FILE_PATH"] 
    # FILE_PATH = stt_env.get_path()
    vtt_path = Path(f"{FILE_PATH}/{user}/{vtt_name}")
    return vtt_path


async def get_file_size(file_path):
    return os.stat(file_path).st_size
