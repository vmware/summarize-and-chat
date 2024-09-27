# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import json
from src.services.vllm import LocalLLM
from src.config import logger
from src.utils.env import _env
from src.config.prompt import mistral_route_template_str

server_config = _env.get_server_values()
llm_config = _env.get_qamodel_values()
modelName = llm_config['MODEL']

def marshal_llm_to_json(output: str) -> str:
    """
    Extract a substring containing valid JSON or array from a string.

    Args:
        output: A string that may contain a valid JSON object or array surrounded by
        extraneous characters or information.

    Returns:
        A string containing a valid JSON object or array.
    """
    output = output.strip().replace("{{", "{").replace("}}", "}")

    left_square = output.find("[")
    left_brace = output.find("{")

    if left_square < left_brace and left_square != -1:
        left = left_square
        right = output.rfind("]")
    else:
        left = left_brace
        right = output.rfind("}")

    return output[left : right + 1]

def agent(query: str):
    llm = LocalLLM(model_name = modelName)
    prompt = f'''<s>[INST]
You are a smart helpful assistant that help user do a choose.
Some choices are given below. It is provided in a numbered list (1 to 2), where each item in the list corresponds to a summary.
---------------------
(1) Useful for retrieving specific context related to the data source
(2) Useful for summarization questions related to the data source
---------------------
Using only the choices above and not prior knowledge, return the only one choice that is most relevant to the user question.

The output should be ONLY JSON formatted as a JSON instance.

Here is an example:

{{
    "choice": 1,
    "reason": "<insert reason for choice>"
}}[/INST]</s>

[INST]{query}[/INST]
Answer:'''
    json_obj = {"choice":1,"reason":""}
    try:
        json_string = marshal_llm_to_json(str(llm.complete(prompt)))
        json_obj = json.loads(json_string)
        logger.info(f'--agent--:{json_obj}')
    except Exception as e:
        logger.error(e)
    return json_obj


def route_query(query: str):
    llm = LocalLLM(model_name = modelName,num_output=8)
    prompt = mistral_route_template_str.format(USER_QUERY=query)
    route = llm.complete(prompt).text
    logger.info(f'--route--:{route}')
    return route.strip()