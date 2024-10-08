# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path
import os,time, json
from typing import List

from llama_index.core.schema import Document, MetadataMode
from llama_index.core.indices.document_summary.base import DocumentSummaryIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import get_response_synthesizer
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    SimpleDirectoryReader
)
from llama_index.core.ingestion import IngestionPipeline
from llama_index.vector_stores.postgres import PGVectorStore

from llama_index.core.extractors import (
    QuestionsAnsweredExtractor,
    TitleExtractor,
)
from llama_index.core.schema import Document, MetadataMode
from llama_index.core.vector_stores.types import (
    MetadataFilter,
    MetadataFilters,
)

# from llama_index.core import Settings
# from llama_index.llms.openai_like import OpenAILike
from llama_index.core.indices.postprocessor import SentenceTransformerRerank
from llama_index.postprocessor.nvidia_rerank import NVIDIARerank

# from llama_index.core.postprocessor import LLMRerank

from sqlalchemy import make_url

from src.config import logger
from src.utils.env import _env
from src.utils.loader import pdf_extractor
from src.db.database import DocumentDB
from src.services.vllm import LocalLLM, get_embedder, get_rerank_model
from src.config.constant import title_node_template_str, title_combine_template_str, get_question_template

# from src.config.constant import summary_query_str,document_summary_template
from src.model.embedding import EmbeddingModel
from src.utils.format import full_string_to_list

qa_config = _env.get_qamodel_values()

class PgvectorDB:
    
    def __init__(self):
        server_config = _env.get_server_values()
        qa_config = _env.get_qamodel_values()
        embedder_config = _env.get_embedder_values()
        reranker_config = _env.get_reranker_values()
        db_config = _env.get_db_values()
    
        self.filepath = server_config['FILE_PATH']
        self.embedding_model = embedder_config['MODEL']
        # self.vector_dim = embedder_config['VECTOR_DIM']
        # self.embed_batch_size = embedder_config['BATCH_SIZE']
        
        self.reranker_model = reranker_config['MODEL']
        self.reranker_base_url= reranker_config['API_BASE']
        self.reranker_top_n = reranker_config['RERANK_TOP_N']
        
        self.chunk_size = qa_config['CHUNK_SIZE']
        self.chunk_overlap = qa_config['CHUNK_OVERLAP']
        self.llm_model = qa_config['MODEL']
        self.num_workers=server_config['NUM_WORKERS']
        
        self.db_host = db_config['PG_HOST']
        self.db_port = db_config['PG_PORT']
        self.db_user = db_config['PG_USER']
        self.db_passwd = db_config['PG_PASSWD']
        # self.default_db = "postgres"
        self.db_name = db_config['PG_DATABASE']
        self.table_name = db_config['PG_TABLE']
        
        # self.connection_string = f"postgresql://{self.db_user}:{self.db_passwd}@{self.db_host}:{self.db_port}/{self.default_db}"
        
        # self.embed_model = EmbeddingModel(model_name=self.embedding_model, embed_batch_size=self.embed_batch_size)
        self.embed_model, self.embedding_size = get_embedder()
        self.top_k = qa_config['SIMIL_TOP_K']
        
        self.documentDB = DocumentDB(db_config)
 

    def add_meta(self, documents: List[Document], user: str):
        for doc in documents:
            # Keep only the file name and eliminate the absolute path of the file to keep the file safe
            file_name = os.path.basename(doc.metadata['file_path'])
            # doc.metadata['file_path'] = file_name
            doc.metadata['file_name'] = file_name
            doc.metadata['user'] = user
            
            # clean the below metadata info which generate in the index step, those info just in order to improve vector retrieve, clean it reduce the LLM context window.
            # - document_title:
            # - questions_this_excerpt_can_answer:
            doc.excluded_llm_metadata_keys = ['document_title',
                                            'questions_this_excerpt_can_answer',
                                            'file_path',
                                            'file_size',
                                            'file_type',
                                            'creation_date',
                                            'last_modified_date',
                                            'last_accessed_date',
                                            'user']

    def add_docid(self, documents: List[Document], id: int):
        for doc in documents:
            doc.doc_id = str(id)

    def get_connection(self):
        conn = PGVectorStore.from_params(
            database = self.db_name,
            host = self.db_host,
            password = self.db_passwd,
            port = self.db_port,
            user = self.db_user,
            table_name = self.table_name,
            embed_dim = self.embedding_size, # embedding model dimension
            cache_ok = True,
            hybrid_search = True, # retrieve nodes based on vector values and keywords
        )
        return conn

    # file: full path of file
    def vector_index(self, file: str, user: str, doc_id: str, vttfile: str=''):
        logger.info(f'----init_pgvector_engine---{file}---{user}---{vttfile}---')
        s = time.time()
        
        text_splitter = SentenceSplitter(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        llm = LocalLLM(model_name=self.llm_model)

        extractors = [
            # TitleExtractor(llm=llm,
            #                nodes=5,
            #                node_template=title_node_template_str,
            #                combine_template=title_combine_template_str,
            #                metadata_mode=MetadataMode.EMBED),
            QuestionsAnsweredExtractor(llm=llm,
                                    questions=3,
                                    prompt_template=get_question_template(self.llm_model),
                                    metadata_mode=MetadataMode.EMBED)
        ]
        
        if vttfile == '':
            filepath = file
        else:
            filepath = vttfile

        documents = SimpleDirectoryReader(input_files=[Path(filepath)], file_extractor={".pdf": pdf_extractor()}).load_data()  
        self.add_meta(documents, user)
        self.add_docid(documents, doc_id)
        pipeline = IngestionPipeline(transformations=[text_splitter] + extractors, documents=documents)

        # parallel to do extractors
        nodes = pipeline.run(num_workers = self.num_workers)
        questions = []
        for node in nodes:
            metadata_json = json.dumps(node.metadata, indent=4)  # Convert metadata to formatted JSON
            print(metadata_json)
            data = json.loads(metadata_json)
            text = data['questions_this_excerpt_can_answer']
            questions.extend(full_string_to_list(text))
          
        # Connect to the PGVector extension
        vector_store = PGVectorStore.from_params(
            database = self.db_name,
            host = self.db_host,
            password = self.db_passwd,
            port = self.db_port,
            user = self.db_user,
            table_name = self.table_name,
            embed_dim = self.embedding_size, # embedding model dimension
            cache_ok = True,
            hybrid_search = True, # retrieve nodes based on vector values and keywords
        )

        # LlamaIndex persistence object backed by the PGVector connection
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # LlamaIndex index population (nodes -> embeddings -> vector store)
        index = VectorStoreIndex(
            nodes = nodes, 
            storage_context = storage_context,
            embed_model = self.embed_model,
            show_progress=True,
            transformations = None,
        )
        logger.info(f'----index spend time:---{time.time()-s}---')

        self.documentDB.update_document(str(file), user, questions)
        return index

    def get_index(self, file: str, user: str):
        vector_store = PGVectorStore.from_params(
            database = self.db_name,
            host = self.db_host,
            password = self.db_passwd,
            port = self.db_port,
            user = self.db_user,
            table_name = self.table_name,
            embed_dim = self.embedding_size, # embedding model dimension
            cache_ok = True,
            hybrid_search = True, # retrieve nodes based on vector values and keywords
        )

        # LlamaIndex persistence object backed by the PGVector connection
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # load your index from stored vectors
        # index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)
        index = VectorStoreIndex.from_vector_store(
            vector_store, 
            storage_context=storage_context,
            embed_model = self.embed_model
        )
        return index
    
    def retriever(self, file: str, user: str, simil_top_k: int, re_ranker):
        logger.info(f'----retrieve2---{file}---{user}---')
        filename = os.path.basename(file)
        logger.info(f'----retrieve2---{filename}')
        index = self.get_index(file, user)
        
        filters = MetadataFilters(
            filters=[
                MetadataFilter(key="user", value=user),
                MetadataFilter(key="file_name", value=filename),
            ],
            condition="and",
        )
        
        index_retriever = index.as_retriever(
            similarity_top_k = self.top_k,
            filters = filters,
            node_postprocessors=[re_ranker],
            vector_store_kwargs={"hnsw_ef_search": 256},
        )
        return index_retriever
     
    def delete_index(self, file: str, user: str, ref_doc_id):
        # Connect to the PGVector extension
        index = self.get_index(file, user)
        index.delete_ref_doc(ref_doc_id, delete_from_docstore=True)
        # # get node_id 
        # node_ids = []
        # index.delete_nodes(node_ids, delete_from_docstore=True)
        
    def index_status(self, file: str, user: str):
        result = self.documentDB.get_status(str(file), user)
        return result

    def questions(self, file: str, user: str):
        logger.info(f'----retrieve---{file}---{user}---')
        result = self.documentDB.get_questions(str(file), user)
        return result
    
pgvectorDB = PgvectorDB()