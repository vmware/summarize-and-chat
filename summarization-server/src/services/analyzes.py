import pickle, json
from pathlib import Path
from fastapi.responses import StreamingResponse
from langchain.document_loaders import UnstructuredWordDocumentLoader, PyPDFLoader, TextLoader, UnstructuredPowerPointLoader

from src.services.document import stage1_summarize, stage2_summarize
from src.services.vllm import LCCustomLLM
from src.config import logger
from src.utils.env import _env
from src.model.file_type import get_file_type
from src.utils.format import pages_to_document, read_vtt
from src.services.auth import ErrorResponse
from src.services.vllm import call_stream
from src.config.prompt import choose_analyze_template
from src.utils.format import response_format

server_config = _env.get_server_values()
llm_config = _env.get_llm_values()

def meta_info(filename, user):
    meta_str = f'document:{filename}  '
    doc_meta_path = Path(f"{server_config['FILE_PATH']}/{user}/metadata/{filename}.pkl")
    if doc_meta_path.exists():
        meta = pickle.load(open(doc_meta_path, "rb"))
        for key, value in meta.items():
            meta_str = meta_str + key + ':' + value + '  '
    return meta_str


async def summarize_doc(docs, chunk_size, chunk_overlap, model_name, temperature, user):
    max_token = llm_config["SUMMARIZE_MODEL_MAX_TOKEN_LIMIT"]
    modelDict = _env.get_model_by_name(model_name)
    max_token = int(modelDict.get("max_token"))
    
    filename = Path(docs[0].metadata['source']).name
    doc_summary_path = Path(f"{server_config['FILE_PATH']}/{user}/summary/{filename}_{chunk_size}_{chunk_overlap}_{model_name}_{temperature}.pkl")
    if doc_summary_path.exists():
        summary = pickle.load(open(doc_summary_path, "rb"))['summary']
        return summary
    else:
        chunk_prompt = "Write a concise summary."
        final_prompt = "Write a concise summary. Do not copy the structure from the provided context. Avoid repetition."
        final_context = await stage1_summarize(docs, chunk_size, chunk_overlap, chunk_prompt, model_name, temperature)

        if LCCustomLLM.tokens(final_context) > max_token:
            final_context = await stage2_summarize(final_context, chunk_size, chunk_overlap, final_prompt, model_name, temperature)

        data = {'summary': str(final_context)}
        doc_summary_path.parent.mkdir(parents=True, exist_ok=True)
        pickle.dump(data, open(doc_summary_path, "wb"))
        return final_context


async def multi_document_analyze(data, user):
    combine_summary = ''
    for f in data.file:
        doc_path = Path(f"{server_config['FILE_PATH']}/{user}/{f}")
        file_type = get_file_type(f)
        try:
            if file_type.word is True:
                loader = UnstructuredWordDocumentLoader(str(doc_path))
                docs = loader.load()
                docs = pages_to_document(docs)
            elif file_type.pdf is True:
                loader = PyPDFLoader(str(doc_path))
                docs = loader.load()
            elif file_type.ppt is True:
                loader = UnstructuredPowerPointLoader()
                docs = loader.load()
                docs = pages_to_document(docs)
            elif file_type.txt is True:
                loader = TextLoader(str(doc_path), autodetect_encoding=True)
                docs = loader.load()
            elif file_type.vtt is True:
                docs = read_vtt(doc_path, '00:00:00', '12:00:00')
        except Exception as e:
            logger.error(e)
            return ErrorResponse('load document failed!', 400)
        summary = await summarize_doc(docs, data.chunk_size, data.chunk_overlap, data.model, data.temperature, user)
        meta_str = meta_info(f, user)
        combine_summary = combine_summary + meta_str + '\n' + summary + '\n\n'

    # format and length parameter just use to controller final summary
    final_prompt = response_format(data.prompt, data.format, data.length)
    final_prompt = choose_analyze_template(data.model).format(text=combine_summary, prompt=final_prompt)
    logger.info(f'---final_prompt----{final_prompt}')

    temperature = data.temperature
    model = data.model
    def event_stream():
        response = call_stream(final_prompt, model=model, temperature=temperature)
        for chunk in response:
            msg = {
                "text": chunk.choices[0].text,
                "finish": chunk.choices[0].finish_reason
            }
            data = f'event: message\nretry: 15000\ndata:{json.dumps(msg)}\n\n'
            yield data

    return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')
