from fastapi.responses import StreamingResponse
import math,json,os
from pydub import AudioSegment
from pathlib import Path
from werkzeug.utils import secure_filename
import shutil

from src.utils.env import _env
from src.model.file_type import validate_audio
from src.services.auth import ErrorResponse
from src.utils.email import notify_vtt_finished

config = _env.get_server_values()

def convert_seconds_to_hms(seconds):
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = math.floor((seconds % 1) * 1000)
    output = f"{int(hours):02}:{int(minutes):02}:{int(seconds):02},{milliseconds:03}"
    return output


# async def audio_to_text(audio_file, vtt_file, user):
#     print('---audio to vtt----')
#     # return vtt data
#     if vtt_file.exists():
#         def stream_data():
#             result = {
#                 "progress": 1,
#                 "finished": "done"
#             }
#             data = f'event: message\nretry: 15000\ndata:{json.dumps(result)}\n\n'
#             yield data
#         return StreamingResponse(stream_data(), media_type='text/event-stream;charset=utf-8')

#     # model_size = "large-v2"
#     model_size = "small"
#     # compute_type: int8_float16, int8
#     model = WhisperModel(model_size, device="cpu", compute_type="int8", download_root="./cache")
#     # local need manual download huggingface model to local
#     # model = WhisperModel(model_size, device="cpu", compute_type="int8",cpu_threads=4,num_workers=4,download_root="D:\\code\\summarization-server\\DC")
#     # filter out parts of the audio without speech
#     segments, info = model.transcribe(str(audio_file), vad_filter=True)
#     # audio time
#     sound = AudioSegment.from_file(str(audio_file))
#     audio_time = len(sound) / 1000

    def event_stream():
        part = 0
        progress = 0
        vtt = 'WEBVTT\n\n'
        for segment in segments:
            duration = f"{convert_seconds_to_hms(segment.start)} --> {convert_seconds_to_hms(segment.end)}\n"
            result = "{:.2f}".format(round(segment.end/audio_time, 2))
            progress = float(result)
            if progress > 1:
                progress = 1
            print(progress)
            text = segment.text.strip() + '\n\n'
            part += 1
            line = str(part) + "\n" + duration + text
            msg = {
                # "text": line,
                "progress": progress,
                "finished": "in progress"
            }
            vtt += line
            data = f'event: message\nretry: 15000\ndata:{json.dumps(msg)}\n\n'
            yield data

        # write vtt
        with open(str(vtt_file), 'w', encoding="utf-8") as file:
            file.write(vtt)
        result = {
            # "text": '',
            "progress": 1,
            "finished": "done"
        }
        data = f'event: message\nretry: 15000\ndata:{json.dumps(result)}\n\n'
        # send email
        if vtt_file.exists():
            try:
                notify_vtt_finished(user, audio_file.name)
            except Exception as e:
                print(str(e))
        yield data
    return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')


def get_audios(user):
    user_path = Path(f"{config['FILE_PATH']}/{user}")
    all = user_path.glob("*")
    audios = []
    for a in all:
        if a.is_file() and validate_audio(a.name):
            audios.append(a)
    return audios


def get_vtt(audio: Path, user: str):
    name = f'.{audio.name.split(".")[-1]}'
    vtt_name = audio.name.replace(name, '.vtt')
    vtt_path = Path(f"{config['FILE_PATH']}/{user}/{vtt_name}")
    return vtt_path

def remove_file(name: str, user: str):
    filename = secure_filename(name)
    file_path = Path(f"{config['FILE_PATH']}/{user}/{filename}")
    file_meta_path = Path(f"{config['FILE_PATH']}/{user}/metadata/{filename}.pkl")
    summary_path = Path(f"{config['FILE_PATH']}/{user}/summary")
    base_name, _ = os.path.splitext(filename)
    vector_index_path = Path(f"{config['FILE_PATH']}/{user}/{base_name}_vector")
    summary_index_path = Path(f"{config['FILE_PATH']}/{user}/{base_name}_summary")
    summary_history_path = Path(f"{config['FILE_PATH']}/{user}/summary_history/{filename}.pkl")
    try:
        if file_path.exists():
            file_path.unlink()
        if file_meta_path.exists():
            file_meta_path.unlink()
        if validate_audio(name):
            vtt_path = get_vtt(file_path, user)
            if vtt_path.exists():
                vtt_path.unlink()
        if summary_path.exists():
            summarys = summary_path.glob(f"{filename}_*_*.pkl")
            for s in summarys:
                s.unlink()
        if vector_index_path.exists():
            shutil.rmtree(vector_index_path)
        if summary_index_path.exists():
            shutil.rmtree(summary_index_path)
        if summary_history_path.exists():
            summary_history_path.unlink()
    except Exception as e:
        return ErrorResponse(str(e), 500)
    return {'data': 'success'}


def get_user_files(user):
    user_path = Path(f"{config['FILE_PATH']}/{user}")
    all = user_path.glob("*")
    files = []
    for a in all:
        if a.is_file():
            files.append(a)
    return files