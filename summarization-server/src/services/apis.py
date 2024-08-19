from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import asyncio

from src.services.vllm import LCCustomLLM

async def pdf_summarize(docs, prompt):
    llm = LCCustomLLM(verbose=True)
    map_template = f'''<s>[INST] <<SYS>>You are a smart AI document assistant could answer user query by provide the document context information and must comply with the following rules:
1.Answer user query only base on provided document context information and not prior knowledge.
2.If context information too little to answer query and you should give answer:'please provide more context information'.
3.In your answer avoid generating duplicate content.
4.Don't make up information that document context information not provide.
<</SYS>>
Document Context information is below.
---------------------
{{text}}
---------------------
Query:{prompt}[/INST]
    '''
    map_prompt = PromptTemplate.from_template(template=map_template)
    map_chain = LLMChain(llm=llm, prompt=map_prompt, verbose=True)

    sem = asyncio.Semaphore(6)
    tasks = [LCCustomLLM.async_page_generate(map_chain, doc, sem) for doc in docs]
    resp = await asyncio.gather(*tasks)
    summary = []
    for r in resp:
        result = r['summary']
        summary.append({'page': r['metadata']['page'] + 1, 'summary': result})
    return {'data': summary}

