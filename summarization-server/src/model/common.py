# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

class User:
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

def extract_data(data, key, default=None):    
    if key in data:
        d = data[key]
    elif default == []:
        d = default
    else:
        d = None
    return d


