from llama_index.core.schema import QueryBundle,NodeWithScore
from llama_index.core.retrievers import BaseRetriever
from typing import Any, List
from src.config import logger
from src.utils.env import _env
from src.config.constant import query_gen_template
from src.services.vllm import LocalLLM
from src.utils.format import full_string_to_list
import time

llm_config = _env.get_llm_values()

def generate_queries(query_str: str):
    fmt_prompt = query_gen_template.format(
        num_queries=llm_config['NUM_QUERIES'], query=query_str
    )
    llm = LocalLLM(model_name="meta-llama/Meta-Llama-3-70B-Instruct")
    response = llm.complete(fmt_prompt)
    queries = full_string_to_list(response.text)
    return queries


def run_queries(queries, retrievers):
    """Run queries against retrievers."""
    task_results = []
    for query in queries:
        for i, retriever in enumerate(retrievers):
            task_results.append(retriever.retrieve(query))
    results_dict = {}
    for i, (query, query_result) in enumerate(zip(queries, task_results)):
        results_dict[(query, i)] = query_result
    return results_dict


def fuse_results(results_dict, similarity_top_k: int = 3):
    """Apply reciprocal rank fusion.

    The original paper uses k=60 for best results:
    https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf
    """
    k = 60.0  # `k` is a parameter used to control the impact of outlier rankings.
    fused_scores = {}
    text_to_node = {}

    # compute reciprocal rank scores
    for nodes_with_scores in results_dict.values():
        for rank, node_with_score in enumerate(
            sorted(
                nodes_with_scores, key=lambda x: x.score or 0.0, reverse=True
            )
        ):
            text = node_with_score.node.get_content()
            text_to_node[text] = node_with_score
            if text not in fused_scores:
                fused_scores[text] = 0.0
            fused_scores[text] += 1.0 / (rank + k)

    # sort results
    reranked_results = dict(
        sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
    )

    # adjust node scores
    reranked_nodes: List[NodeWithScore] = []
    for text, score in reranked_results.items():
        reranked_nodes.append(text_to_node[text])
        reranked_nodes[-1].score = score
    return reranked_nodes[:similarity_top_k]


class FusionRetriever(BaseRetriever):
    """Ensemble retriever with fusion."""

    def __init__(
        self,
        retrievers: List[BaseRetriever],
        similarity_top_k: int = 3,
    ) -> None:
        """Init params."""
        self._retrievers = retrievers
        self._similarity_top_k = similarity_top_k
        super().__init__()

    def _retrieve(self, query_bundle: QueryBundle) -> List[NodeWithScore]:
        """Retrieve."""
        start = time.time()
        # Temporarily not used
        # queries = generate_queries(query_bundle.query_str)
        # logger.info(f'-----queries-----{queries}')
        # logger.info(f'-----generate same queries spend time-----{time.time()-start}')
        start = time.time()
        queries = [query_bundle.query_str]
        results = run_queries(queries, self._retrievers)
        logger.info(f'-----results-----{results}')
        logger.info(f'-----queries retrieve nodes spend time-----{time.time() - start}')
        start = time.time()
        final_results = fuse_results(
            results, similarity_top_k=self._similarity_top_k
        )
        logger.info(f'-----final_results-----{final_results}')
        logger.info(f'-----retrieve nodes rerank spend time-----{time.time() - start}')
        return final_results