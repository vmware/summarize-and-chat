from fastapi.responses import StreamingResponse
from src.services.vllm import call_stream


async def answer(q):
    prompt = f"<s>[INST]{q.q.strip()}[/INST]"
    def event_stream():
        response = call_stream(prompt)
        for chunk in response:
            current_content = chunk.choices[0].text
            data = f'event: message\nretry: 15000\ndata:{current_content}\n\n'
            yield data
    return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')
