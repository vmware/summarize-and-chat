import os, time, yaml, json
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

    def is_valid(self):
        if not self.content:
            return False
        return True

    def set_content(self, content):
        self.content = content

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
        self.env = os.getenv('SYS_ENV', 'local')
        self.env = self.env if self.env else ENV.LOCAL
        self.curenv, self.configfile = self.get_config_file()
        self.configfile.read()
        okta = self.get_okta_values()
        self.okta_auth_url = okta["OKTA_AUTH_URL"] if okta else ''
        self.okta_client_id = okta["OKTA_CLIENT_ID"] if okta else ''
        
        self.models = []
        f = open("src/config/models.json")
        data = json.load(f)
        for i in data['models']:
            self.models.append(i)
        f.close()
        
        self.model_dict = {}
        for model in self.models:
            self.model_dict[model['name']] = model
        
    def get_env(self):
        return self.curenv

    def get_config_file(self):
        curenv = self.get_system_env('SYS_ENV', ENV.LOCAL.value)
        filename = f"src/config/{curenv if curenv != ENV.LOCAL.value else 'config'}.yaml"
        return curenv, EnvConfigFile(filename)
    
    def get_config_content(self, refresh=False):
        if not self.configfile:
            raise Exception('env configfile not found')
        if refresh:
            self.configfile.read(refresh)
        return self.configfile.content
    
    
    def get_auth_values(self, refresh=False):
        auth = self.get_config('auth', refresh=refresh)
        if auth:
            return self.get_children(auth, ["API_AUTH_URL", "AUTH_KEY"])
        return {}

    def get_okta_values(self, refresh=False):
        okta = self.get_config('okta', refresh=refresh)
        if okta:
            return self.get_children(okta, ["OKTA_AUTH_URL", "OKTA_CLIENT_ID", "OKTA_ENDPOINTS"])

    def get_llm_values(self, refresh=False):
        llm = self.get_config('llm', refresh=refresh)
        if llm:
            return self.get_children(llm, ["LLM_API", "AUTH_KEY", "QA_MODEL", "SUMMARIZE_MODEL", "AUDIO_API", "EMBEDDING_MODEL", "VECTOR_DIM","CHUNK_SIZE", "CHUNK_OVERLAP", "NUM_QUERIES", "TOP_K","QA_MODEL_MAX_TOKEN_LIMIT","SUMMARIZE_MODEL_MAX_TOKEN_LIMIT","AUDIO_API_MAX_TOKEN_LIMIT","EMBEDDING_MODEL_MAX_TOKEN_LIMIT","MAX_NUM_TOKENS","MAX_COMPLETION", "LLM_BATCH_SIZE"])
        
    def get_db_values(self, refresh=False):
        db = self.get_config('database', refresh=refresh)
        if db:
            return self.get_children(db, ["PG_HOST", "PG_PORT", "PG_USER", "PG_PASSWD", "PG_DATABASE", "PG_TABLE"])     
                
    def get_server_values(self, refresh=False):
        server = self.get_config('server', refresh=refresh)
        if server:
            return self.get_children(server, ["HOST", "PORT", "RELOAD", "NUM_WORKERS", "PDF_READER", "FILE_PATH", "VECTOR_DB"])
    
    def get_email_values(self, refresh=False):
        email = self.get_config('email', refresh=refresh)
        if email:
            return self.get_children(email, ["SMTP_SERVER", "SENDER", "SUMMARIZER_URL"])            
    
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
    
    def get_path(self):
        if self.env == 'dev' or self.env == 'sandbox':
            file_path = "/app/data/dev"
        elif self.env == "stg" or self.env == 'stage' or self.env == 'staging':
            file_path = "/app/data/stg"
        elif self.env == "prd" or self.env == 'prod' or self.env == "production":
            file_path = "/app/data/prod"
        else:
            file_path = "./data/local"
        return file_path

    def get_model_path(self):
        if self.env == 'local':
            model_path = "./data/fwmodel"
        else:
            model_path = "/app/data/fwmodel"
        return model_path
    
    def get_models(self):
        return self.models
    
    def get_model_dict(self):
        return self.model_dict
    
    def get_model_by_name(self, name):
        return self.model_dict.get(name)
            
_env = environment()
