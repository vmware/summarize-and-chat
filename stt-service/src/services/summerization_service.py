from src.utils.env import stt_env
import requests
from src.utils.logger import logger

server_config= stt_env.get_server_values()

def notification_summerization_service(vtt_path, audio_path, env, token, user):
    if vtt_path.exists():
        try:
            access_token = token
            sum_api_url= server_config["SUMMARIZATION_SERVER"] + "/api/v1/audio-to-vtt/complete"
            headers = {
                "Content-Type": "application/json",
                "authorization": "Bearer " + access_token
            }
            data = {
                "audio": str(audio_path),
                "vtt_path": str(vtt_path),
                "user": user,
                "env": env
            }
            logger.info(f'NOTIFICATION: data: {data}')
            res = requests.post(sum_api_url, headers=headers, json=data)
        except Exception as e:
            logger.error(f'AUDIO-TO-VTT NOTIFICATION ERROR', e)
            
            