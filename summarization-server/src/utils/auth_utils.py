import base64
import jwt
import datetime

def encode_password(password):
    """
    Encode a password using Base64.
    
    Args:
        password (str): The password to encode.
    
    Returns:
        str: The Base64 encoded password.
    """
    password_bytes = password.encode('utf-8')
    encoded_password = base64.b64encode(password_bytes)
    return encoded_password.decode('utf-8')

def decode_password(encoded_password):
    """
    Decode a Base64 encoded password.
    
    Args:
        encoded_password (str): The Base64 encoded password.
    
    Returns:
        str: The decoded password.
    """
    encoded_password_bytes = encoded_password.encode('utf-8')
    password_bytes = base64.b64decode(encoded_password_bytes)
    return password_bytes.decode('utf-8')

async def generate_jwt_token(payload, secret_key, expiration_time=3600):
    """
    Generate a JWT token from a payload.

    Args:
        payload (dict): The payload to encode in the JWT token.
        secret_key (str): The secret key to use for signing the JWT token.
        expiration_time (int, optional): The expiration time in seconds. Defaults to 3600 (1 hour).

    Returns:
        str: The generated JWT token.
    """
    # Set the expiration time
    payload['exp'] = datetime.datetime.utcnow() + datetime.timedelta(seconds=expiration_time)

    # Generate the JWT token
    token = jwt.encode(payload, secret_key, algorithm='HS256')

    return token

def jwt_decode(encoded_jwt, secret_key):
    return jwt.decode(encoded_jwt, secret_key, algorithms=["HS256"])