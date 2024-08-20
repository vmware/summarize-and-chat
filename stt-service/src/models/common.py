import re
from enum import Enum
from datetime import datetime
from pydantic import BaseModel
    
class User:
    def __init__(self, request_json) -> None:
        self.id = request_json.get("id", 0)
        self.email = request_json.get('email', "")
        self.name = request_json.get('name', "")
        self.first_name = request_json.get('first_name', "")
        self.last_name = request_json.get('last_name', "")
        self.api_tokens = request_json.get('api_tokens', "")
        self.created = datetime.timestamp(datetime.now())
        defvalue = request_json.get('defaults', "")
        self.defaults = defvalue if defvalue else ""

class AudioInfo(BaseModel):
    audio: str
    user: str
    env: str