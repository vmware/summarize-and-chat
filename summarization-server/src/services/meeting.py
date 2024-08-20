import json
import asyncio
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from fastapi.responses import StreamingResponse

from src.services.vllm import LCCustomLLM
from src.config import logger
from src.services.vllm import call_stream
from src.utils.env import _env
from src.config.prompt import choose_meeting_template
from src.utils.summary_store import store_summary
from src.utils.email import notify_summary_finished

llm_config = _env.get_llm_values()

# summarize each chunk
async def stage1_summarize(docs, chunk_size, chunk_overlap, chunk_prompt, model_name, temperature):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=LCCustomLLM.tokens,
        is_separator_regex=False

    )
    llm = LCCustomLLM(verbose=True, model_name=model_name, temperature=temperature)
    map_prompt = PromptTemplate(template=choose_meeting_template(model_name), input_variables=["text", "prompt"])
    map_chain = LLMChain(llm=llm, prompt=map_prompt)
    split_docs = text_splitter.split_documents(docs)

    sem = asyncio.Semaphore(llm_config['LLM_BATCH_SIZE'])
    tasks = [LCCustomLLM.async_generate(map_chain, t.page_content, chunk_prompt, sem) for t in split_docs]
    logger.info(f'-------meeting stage1 length------{len(tasks)}')
    resp = await asyncio.gather(*tasks)
    stage1 = ''
    for r in resp:
        stage1 += f"{r}\n"
    return stage1


# combine and reduce chunk result
async def stage2_summarize(stage1, chunk_size, chunk_overlap, prompt, model_name, temperature):
    modelDict = _env.get_model_by_name(model_name)
    max_token = int(modelDict.get("max_token"))
    
    docs = [Document(page_content=stage1)]
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=LCCustomLLM.tokens,
        is_separator_regex=False

    )
    llm = LCCustomLLM(verbose=True, model_name=model_name, temperature=temperature)
    reduce_prompt = PromptTemplate(template=choose_meeting_template(model_name), input_variables=["text", "prompt"])
    reduce_chain = LLMChain(llm=llm, prompt=reduce_prompt)
    split_docs = text_splitter.split_documents(docs)

    sem = asyncio.Semaphore(llm_config['LLM_BATCH_SIZE'])
    tasks = [LCCustomLLM.async_generate(reduce_chain, t.page_content, prompt, sem) for t in split_docs]
    logger.info(f'-------meeting stage2 length------{len(tasks)}')
    resp = await asyncio.gather(*tasks)
    stage2 = ''
    for r in resp:
        stage2 += f"{r}\n"
    # If user final prompt can't reduce token, stop recursive, just return first split document content
    if LCCustomLLM.tokens(stage2) > max_token:
        split_again_docs = text_splitter.split_documents([Document(page_content=stage2)])
        if len(split_again_docs) < len(split_docs):
            return await stage2_summarize(stage2, chunk_size, chunk_overlap, prompt)
        else:
            logger.error(f'-----recursive failed, before split have {len(split_docs)} task, after split have {len(split_again_docs)} task')
            return split_again_docs[0].page_content
    else:
        return stage2


async def summarize_meeting(docs, chunk_size, chunk_overlap, chunk_prompt, final_prompt,
                            model_name, temperature,
                            user=None,
                            file_name=None,
                            ):
    modelDict = _env.get_model_by_name(model_name)
    max_token = int(modelDict.get("max_token"))
    print(max_token)

    final_context = await stage1_summarize(docs, chunk_size, chunk_overlap, chunk_prompt, model_name, temperature)
    if LCCustomLLM.tokens(final_context) > max_token:
        final_context = await stage2_summarize(final_context, chunk_size, chunk_overlap, final_prompt, model_name, temperature)
    final_prompt = choose_meeting_template(model_name).format(text=final_context, prompt=final_prompt)
    logger.info(f'---final prompt---{final_prompt}')
    def event_stream():
        response = call_stream(final_prompt, model=model_name, temperature=temperature)
        summary_history = ''
        for chunk in response:
            msg = {
                "text": chunk.choices[0].text,
                "finish": chunk.choices[0].finish_reason
            }
            data = f'event: message\nretry: 15000\ndata:{json.dumps(msg)}\n\n'
            summary_history += msg['text']
            yield data
        # store summary
        store_summary(summary_history, user, file_name)
        # notify user summary finished
        notify_summary_finished(user, file_name, subject="Meeting Summary Completed")
    return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')