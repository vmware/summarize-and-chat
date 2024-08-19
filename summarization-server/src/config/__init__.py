import os, sys
import importlib
import logging.handlers


# record sys stdout
class StreamToLogger:
    def __init__(self, logger, log_level):
        self.logger = logger
        self.log_level = log_level
        self.linebuf = ''

    def write(self, buf):
        for line in buf.rstrip().splitlines():
            self.logger.log(self.log_level, line.rstrip())

    def flush(self):
        pass

    def isatty(self):
        return False


# logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
fh = logging.handlers.RotatingFileHandler("app.log", mode="a", maxBytes=50*1024, backupCount=3, encoding='utf-8')
formatter = logging.Formatter(
    "%(asctime)s - %(module)s - %(funcName)s - line:%(lineno)d - %(levelname)s - %(message)s"
)
ch.setFormatter(formatter)
fh.setFormatter(formatter)
logger.addHandler(ch)
logger.addHandler(fh)
# sys.stdout = StreamToLogger(logger, logging.INFO)
# sys.stderr = StreamToLogger(logger, logging.ERROR)

# import modules
# env = os.getenv('SYS_ENV', 'local')
# path_file = f"src.config.app_{env}"
# app = importlib.import_module(path_file)
# config = app.app
# config["ENV"] = env


# def env_info():
#     logger.info(f'[ ENV ] = {env}')
#     logger.info(f'[ CONFIG ] = {config}')
