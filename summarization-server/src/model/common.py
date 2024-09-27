# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from typing import Optional, List
from enum import Enum

class AuthenticatedUser:
    sub: str
    iss: str
    context_name: str
    _nonce: str
    azp: str
    authorization_details: list
    domain: str
    context: str
    perms: list
    exp: int
    iat: int
    jti: str
    acct: str
    username: str
    access_token: str

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

def extract_data(data, key, default=None):    
    if key in data:
        d = data[key]
    elif default == []:
        d = default
    else:
        d = None
    return d


