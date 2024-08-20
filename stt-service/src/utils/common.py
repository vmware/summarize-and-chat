import os
import math
from src.utils.logger import logger

def convert_seconds_to_hms(seconds):
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = math.floor((seconds % 1) * 1000)
    output = f"{int(hours):02}:{int(minutes):02}:{int(seconds):02},{milliseconds:03}"
    return output

def file_write(file_path, data, model='w', encoding="utf-8", force_write=False):
    
    logger.debug(f'file_write: file_path: {file_path}')
    with open(str(file_path), model, encoding=encoding) as file:
        file.write(data)
    if force_write:
        file.flush()
        os.fsync(file.fileno())