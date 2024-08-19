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

# class CspToken:
#     sub: str
#     iss: str
#     context_name: str
#     _nonce: str
#     azp: str
#     authorization_details: list
#     domain: str
#     context: str
#     perms: list
#     exp: int
#     iat: int
#     jti: str
#     acct: str
#     username: str
#     access_token: str

# def setCspToken(data, access_token):
#     token = CspToken()
#     token.sub = extract_data(data, 'sub')
#     token.iss = extract_data(data, 'iss')
#     token.context_name = extract_data(data, 'context_name')
#     token._nonce = extract_data(data, '_nonce')
#     token.authorization_details = extract_data(data, 'authorization_details', [])
#     token.domain = extract_data(data, 'domain')
#     token.context = extract_data(data, 'context')
#     token.perms = extract_data(data, 'perms', [])
#     token.exp = extract_data(data, 'exp')
#     token.iat = extract_data(data, 'iat')
#     token.jti = extract_data(data, 'jti')
#     token.acct = extract_data(data, 'acct')
#     token.username = extract_data(data, 'username')
#     token.access_token = access_token
#     return token
    
# class CspAccessToken:
#     id_token: str
#     token_type: str
#     expires_in: int
#     scope: str
#     access_token: str
#     refresh_token: str

def extract_data(data, key, default=None):    
    if key in data:
        d = data[key]
    elif default == []:
        d = default
    else:
        d = None
    return d

# def setCspAccessToken(data):
#     token = CspAccessToken()
#     token.id_token = extract_data(data, 'id_token')
#     token.token_type = extract_data(data, 'token_type')
#     token.expires_in = extract_data(data, 'expires_in')
#     token.scope = extract_data(data, 'scope')
#     token.access_token = extract_data(data, 'access_token')
#     token.refresh_token = extract_data(data, 'refresh_token')
#     return token

# class CspErrorRquest():
#     requestId: str
#     cspErrorCode: str
#     metadata: str
#     moduleCode: int
#     message: str
#     errorCode: int
#     statusCode: int
#     traceId: str

# def setErrors(data):
#     error = CspErrorRquest()
#     error.requestId = extract_data(data, 'requestId')
#     error.cspErrorCode = extract_data(data, 'cspErrorCode')
#     error.metadata = extract_data(data, 'metadata')
#     error.moduleCode = extract_data(data, 'moduleCode')
#     error.message = extract_data(data, 'message')
#     error.errorCode = extract_data(data, 'errorCode')
#     error.statusCode = extract_data(data, 'statusCode')
#     error.traceId = extract_data(data, 'traceId')
#     return error
