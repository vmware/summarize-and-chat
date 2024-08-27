# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import pickle
from pathlib import Path
from src.utils.env import _env
from src.model.file_type import validate_audio
import os

config = _env.get_server_values()

# store summary history
def store_summary(summary: str, user: str, file: str):
    if user and file:
        # handle audio file
        if validate_audio(file):
            base_name, _ = os.path.splitext(file)
            file = f"{base_name}.vtt"
        store_path = Path(f"{config['FILE_PATH']}/{user}/summary_history/{file}.pkl")
        data = {'summary': str(summary)}
        store_path.parent.mkdir(parents=True, exist_ok=True)
        pickle.dump(data, open(store_path, "wb"))


# get summary history
def get_summary_history(user: str, file: str) -> str:
    # handle audio file
    if validate_audio(file):
        base_name, _ = os.path.splitext(file)
        file = f"{base_name}.vtt"
    store_path = Path(f"{config['FILE_PATH']}/{user}/summary_history/{file}.pkl")
    if store_path.exists():
        summary = pickle.load(open(store_path, "rb"))['summary']
    else:
        summary = ""
    return summary
