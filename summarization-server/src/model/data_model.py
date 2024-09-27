# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from src.model.common import Length, Format, Extractiveness
from src.utils.env import _env

llm_config = _env.get_llm_values()
modelName, modelVal = _env.get_default_model() 

class DBUser:
    def __init__(self, fname, lname, email, password, id=None):
        self.id = id
        self.fname = fname
        self.lname = lname
        self.email = email
        self.password = password

    def __str__(self):
        return f"User (fname: \"{self.fname}\", lname: \"{self.lname}\", email: \"{self.email}\", password: \"{self.password}\")"

    def getId(self):
        return self.id

    def from_db(db_user):
        return DBUser(db_user.fname, db_user.lname, db_user.email, db_user.password, db_user.id)

    def getFname(self):
        return self.fname

    def getLname(self):
        return self.lname

    def getEmail(self):
        return self.email

    def getPassword(self):
        return self.password

class UserParams(BaseModel):
    fname: str
    lname: str
    email: str
    password: str

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

class User(BaseModel):
    fname: str
    lname: str
    email: str
    password: str
    
class Content(BaseModel):
    text: str
    length: Length = Length.auto  # One of short, medium, long, or auto defaults to auto
    format: Format = Format.auto  # One of paragraph, bullets, or auto, defaults to auto
    model: str = modelName 
    extractiveness: Extractiveness = Extractiveness.auto  # One of high, medium, or low, defaults to auto
    temperature: float = Field(default=0, ge=0, le=1)  # Between 0 and 1, defaults to 0
    additional_command: str = Field(default='')
    chunk_size: int = Field(default=1000, ge=1000, le=128000)
    chunk_overlap: int = Field(default=100, ge=100, le=300)
    chunk_prompt: Optional[str] = None
    final_prompt: Optional[str] = None


class Multi(BaseModel):
    file: List[str]
    length: Length = Length.auto
    format: Format = Format.auto
    model: str = modelName 
    temperature: float = Field(default=0, ge=0, le=1)
    chunk_size: int = Field(default=1000, ge=1000, le=128000)
    chunk_overlap: int = Field(default=100, ge=100, le=300)
    prompt: str


class Vtt(BaseModel):
    audio: str
    vtt_path: str
    user: str
    env: str