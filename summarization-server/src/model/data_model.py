from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

from src.utils.env import _env

llm_config = _env.get_llm_values()

class Question(BaseModel):
    q: str

class MLModel:
    def __init__(self, name, display_name, max_token):
        self.name = name
        self.display_name = display_name
        self.max_token = max_token

    def __str__(self):
        return f"Model (name: \"{self.name}\", display_name: \"{self.display_name}\", max_token: {self.max_token})"
    
    def getName(self):
        return self.name
    
    def getDisplayName(self):
        return self.display_name
    
    def getMaxToken(self):
        return self.max_token

class Length(str, Enum):
    auto = "auto"
    short = "short"
    medium = "medium"
    long = "long"


class Format(str, Enum):
    auto = "auto"
    paragraph = "paragraph"
    bullets = "bullets"


class Template(str, Enum):
    executive = "executive"
    meeting = "meeting"


# TO DO
class Extractiveness(str, Enum):
    auto = "auto"
    low = "low"
    medium = "medium"
    high = "high"


class Content(BaseModel):
    text: str
    length: Length = Length.auto  # One of short, medium, long, or auto defaults to auto
    format: Format = Format.auto  # One of paragraph, bullets, or auto, defaults to auto
    model: str = llm_config['SUMMARIZE_MODEL'] # ModelName.Llama3_70b
    extractiveness: Extractiveness = Extractiveness.auto  # One of high, medium, or low, defaults to auto
    temperature: float = Field(default=0, ge=0, le=1)  # Between 0 and 1, defaults to 0
    additional_command: str = Field(default='')
    chunk_size: int = Field(default=1000, ge=1000, le=30000)
    chunk_overlap: int = Field(default=100, ge=100, le=300)
    chunk_prompt: Optional[str] = None
    final_prompt: Optional[str] = None


class Multi(BaseModel):
    file: List[str]
    length: Length = Length.auto
    format: Format = Format.auto
    model: str = llm_config['SUMMARIZE_MODEL'] #ModelName.Llama3_70b
    temperature: float = Field(default=0, ge=0, le=1)
    chunk_size: int = Field(default=1000, ge=1000, le=30000)
    chunk_overlap: int = Field(default=100, ge=100, le=300)
    prompt: str


class Vtt(BaseModel):
    audio: str
    vtt_path: str
    user: str
    env: str