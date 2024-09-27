# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import json
from werkzeug.utils import secure_filename
from pathlib import Path
import os, time, re

from fastapi.responses import StreamingResponse
from openai import OpenAI

# from langchain.embeddings import HuggingFaceEmbeddings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.query_engine import RetrieverQueryEngine

from src.config.prompt import mistral_route_template_str, mistral_direct_answer_template_str
from src.model.embedding import EmbeddingModel
from src.utils.format import full_string_to_list
from src.services.vllm import LocalLLM, call_stream
from src.model.file_type import validate_audio
from src.db.pgvector_db import pgvectorDB
from src.config.constant import get_text_qa_template,get_refine_template,get_summary_template
from src.config import logger
from src.utils.env import _env
from src.model.fusion_retriever import FusionRetriever
from src.db.database import ChatDB
from src.services.agent import route_query

server_config = _env.get_server_values()
qa_config = _env.get_qamodel_values()
embedder_config = _env.get_embedder_values()
reranker_config = _env.get_reranker_values()
pg_config = _env.get_db_values()

chatDB = ChatDB(pg_config)

modelName = qa_config['MODEL']
client = OpenAI(api_key = qa_config['API_KEY'], base_url = qa_config['API_BASE'])

def questions(doc: str, user: str):
    filepath = Path(f"{server_config['FILE_PATH']}/{user}/{doc}")
    questions = pgvectorDB.questions(str(filepath), user)
    if questions:
        return {'file': doc, 'questions': questions}
    else:
        return {'file': doc, 'questions': []}

async def llmaindex_rag(query: str, user: str, doc: str):
    route = route_query(query)
    if re.search(r'RAG_SEARCH', route):
        doc = secure_filename(doc)
        # handle audio file, read the vtt file to chat
        if validate_audio(doc):
            base_name, _ = os.path.splitext(doc)
            doc = f"{base_name}.vtt"
            
        llm = LocalLLM(model_name = modelName, context_window=30000)
        embed_model, embedding_size = _env.get_embedder()
        # embed_model = EmbeddingModel(model_name=embedder_config['MODEL'], embed_batch_size=embedder_config['BATCH_SIZE'])
        text_splitter = SentenceSplitter(chunk_size=qa_config['CHUNK_SIZE'], chunk_overlap=qa_config['CHUNK_OVERLAP'])
        start = time.time()
        
        response_mode = 'compact'
        re_ranker = _env.get_rerank_model()
        
        retriever = pgvectorDB.retriever(doc, user, qa_config['SIMIL_TOP_K'], re_ranker)
        logger.info(f'-----load index spend time--------{time.time()-start}')
        
        vector_query_engine = RetrieverQueryEngine.from_args(
            llm=llm,
            transformations=[text_splitter],
            embed_model=embed_model,
            retriever=retriever,
            response_mode=response_mode,
            text_qa_template=get_text_qa_template(modelName),
            refine_template=get_refine_template(modelName),
            summary_template=get_summary_template(modelName),
            similarity_top_k=qa_config['SIMIL_TOP_K'],
            streaming=True
        )
        result = vector_query_engine.query(query)

        def event_stream():
            answer = ''
            for chunk in result.response_gen:
                msg = {
                    "text": chunk,
                    "finish": 'null'
                }
                answer += chunk
                data = f'event: message\nretry: 15000\ndata:{json.dumps(msg)}\n\n'
                yield data
            yield f'event: message\nretry: 15000\ndata:{json.dumps({"text":"","finish":"done"})}\n\n'
            # record chat history
            chatDB.add_chat_history(query, user, doc, answer)

        return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')
    else:
        prompt = mistral_direct_answer_template_str.format(USER_QUERY=query)
        result = call_stream(client, prompt=prompt, model=modelName, temperature=0)
        def event_stream():
            answer = ''
            for chunk in result:
                msg = {
                    "text": chunk.choices[0].text,
                    "finish": chunk.choices[0].finish_reason
                }
                answer += chunk.choices[0].text
                data = f'event: message\nretry: 15000\ndata:{json.dumps(msg)}\n\n'
                yield data
            yield f'event: message\nretry: 15000\ndata:{json.dumps({"text":"","finish":"done"})}\n\n'
            # record chat history
            chatDB.add_chat_history(query, user, doc, answer)

        return StreamingResponse(event_stream(), media_type='text/event-stream;charset=utf-8')