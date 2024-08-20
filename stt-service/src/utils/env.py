import os, time, yaml
from enum import Enum

class ENV(Enum):
    PROD = 'prod'
    STG = 'stg'
    DEV = 'dev'
    LOCAL = 'local'
    
class EnvConfigFile():
    def __init__(self, fname):
        self.file = fname
        self.content = None
        self.age = None

    def is_valid(self):
        if not self.content:
            return False
        return True

    def set_content(self, content):
        self.content = content
        self.age = time.time()

    def read(self, refresh=False):
        if refresh or not self.is_valid():
            print('config=',self.file)
            if not os.path.exists(self.file):
                return False
            with open(self.file, "r") as cfgfile:
                self.set_content(yaml.safe_load(cfgfile))
        return True


class environment:
    def __init__(self):
        self.env = os.getenv("ENV")
        self.env = self.env if self.env else ENV.LOCAL
        self.configfile = self.get_config_file()
        self.configfile.read()
        
    def get_config_file(self):
        curenv = self.get_system_env('ENV', ENV.LOCAL.value)
        filename = f"config/{curenv if curenv != ENV.LOCAL.value else 'config'}.yaml"
        return EnvConfigFile(filename)
    
    def get_config_content(self, refresh=False):
        if not self.configfile:
            raise Exception('env configfile not found')
        if refresh:
            self.configfile.read(refresh)
        return self.configfile.content
    
    
    def get_auth_values(self, refresh=False):
        auth = self.get_config('auth', refresh=refresh)
        if auth:
            return self.get_children(auth, ["AUTH_URL", "CACHE_TIMEOUT"])
        return {}

    def get_model_values(self, refresh=False):
        model = self.get_config('model', refresh=refresh)
        if model:
            return self.get_children(model, ["MODEL_SIZE", "COMPUTE_TYPE", "DEVICE","DEVICE_INDEX"])

    def get_server_values(self, refresh=False):
        server = self.get_config('server', refresh=refresh)
        if server:
            return self.get_children(server, ["SERVER_WORKERS", "MAX_WORKS", "RELOAD", "CPU_THREADS", "NUM_WORKERS", "AUDIO_SIZE_LIMITE", "FILE_PATH"])
    
    def get_email_values(self, refresh=False):
        email = self.get_config('email', refresh=refresh)
        if email:
            return self.get_children(email, ["EMAIL_SMTP_SERVER", "EMAIL_SENDER"])            
    
    def get_values(self, keys):
        values = {}
        for key in keys:
            value = self.get_value(key)
            values[key] = value if value else ""
        return values
    
    def get_value(self, key):
        value = self.get_config(key)
        value = value if value else self.get_system_env(key)
        return value

    def get_system_env(self, key, defvalue=None):
        return os.getenv(key, defvalue)
    
    def get_config(self, key, defvalue=None, refresh=False):
        if key:
            if refresh or not self.configfile:
                self.configfile.read(refresh=refresh)
                
            value = self.configfile.content.get(key, None)
            return value if value else defvalue

    def get_children(self, parent, keys):
        values = {}
        for key in keys:
            value = parent.get(key, None)
            values[key] = value if value else ""
        return values
    
    def get_model_path(self):
        print('env=', self.env)
        if self.env == ENV.LOCAL:
            model_path = "./data/fwmodel"
        else:
            model_path = "/app/data/fwmodel"
        return model_path    
   
stt_env = environment()
