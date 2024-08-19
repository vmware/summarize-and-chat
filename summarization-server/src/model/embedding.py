from llama_index.core.base.embeddings.base import BaseEmbedding
from typing import Any, List
from src.config import logger
from src.utils.env import _env
from openai import OpenAI, AsyncOpenAI

config = _env.get_llm_values()
client = OpenAI(api_key=config['AUTH_KEY'], base_url=config['LLM_API'])
aclient = AsyncOpenAI(api_key=config['AUTH_KEY'], base_url=config['LLM_API'])


def get_embedding(model_name: str, text: str) -> List[float]:
    try:
        text = text.replace("\n", " ")
        return client.embeddings.create(input=[text], model=model_name, encoding_format='float').data[0].embedding
    except Exception as e:
        logger.error(f'--embedding error:{e}')


async def aget_embedding(model_name: str, text: str) -> List[float]:
    text = text.replace("\n", " ")
    return await aclient.embeddings.create(input=[text], model=model_name, encoding_format='float').data[0].embedding


class EmbeddingModel(BaseEmbedding):
    def __init__(self, model_name, embed_batch_size=10):
        super().__init__(model_name=model_name, embed_batch_size=embed_batch_size)

    def _get_query_embedding(self, query: str) -> List[float]:
        return get_embedding(self.model_name, query)

    def _get_text_embedding(self, text: str) -> List[float]:
        return get_embedding(self.model_name, text)

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return await aget_embedding(
            self.model_name,
            query,
        )

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return await aget_embedding(
            self.model_name,
            text,
        )

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        list_of_text = [text.replace("\n", " ") for text in texts]
        data = client.embeddings.create(input=list_of_text, model=self.model_name, encoding_format='float').data
        return [d.embedding for d in data]