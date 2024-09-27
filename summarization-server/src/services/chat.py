# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from fastapi.responses import StreamingResponse
from src.services.vllm import call_stream
from src.utils.env import _env
from openai import OpenAI

async def answer(q):
    prompt = f"<s>[INST]{q.q.strip()}[/INST]"
    config = _env.get_qamodel_values()
    client = OpenAI(api_key = config['API_KEY'], base_url = config['API_BASE'])
    
    def event_stream():
        response = call_stream(client, prompt, config['MODEL'])
        for chunk in response:
            current_content = chunk.choices[0].text
            data = f'event: message\nretry: 15000\ndata:{current_content}\n\n'
            yield data
    return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')
