from llama_index.core.prompts import PromptTemplate

text_qa_template_str = (
    "<s>[INST] <<SYS>>"
    "You are an intelligent AI assistant could help users analyze document information, must meet below requirements:\n"
    "1.You do not have prior knowledge about the document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give the source info you used to generate the answer.\n"
    "<</SYS>>\n"
    "Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Query: {query_str}\n"
    "Answer: [/INST]"
)
refine_template_str = (
    "<s>[INST] <<SYS>>"
    "You are an intelligent AI assistant could help users analyze document information, must meet below requirements:\n"
    "1.You do not have prior knowledge about the document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give the source info you used to generate the answer.\n"
    "<</SYS>>\n"
    "The original query is as follows: {query_str}\n"
    "We have provided an existing answer: {existing_answer}\n"
    "We have the opportunity to refine the existing answer (only if needed) with some more context below.\n"
    "------------\n"
    "{context_msg}\n"
    "------------\n"
    "Given the new context, refine the original answer to better answer the query,and no need explain your refine process."
    "If the context is not useful, return the original answer.\n"
    "Answer: [/INST]"
)
summary_template_str =  (
    "<s>[INST] <<SYS>>"
    "You are an intelligent AI assistant could help users analyze document information, must meet below requirements:\n"
    "1.You do not have prior knowledge about the document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give the source info you used to generate the answer.\n"
    "<</SYS>>\n"
    "Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Query: {query_str}\n"
    "Answer: [/INST]"
)

mistral_text_qa_template_str = (
    "<s>[INST]"
    "You are an intelligent AI assistant could help users analyze document info, must meet below requirements:\n"
    "1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give some source info you used to generate answer.[/INST]\n"
    "[INST]Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Query: {query_str}[/INST]\n"
    "Answer:"
)

mistral_refine_template_str = (
    "<s>[INST]"
    "You are an intelligent AI assistant could help users analyze document info, must meet below requirements:\n"
    "1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give some source info you used to generate answer.[/INST]\n"
    "[INST]The original query is as follows: {query_str}\n"
    "We have provided an existing answer: {existing_answer}\n"
    "We have the opportunity to refine the existing answer (only if needed) with some more context below.\n"
    "------------\n"
    "{context_msg}\n"
    "------------\n"
    "Given the new context, refine the original answer to better answer the query,and no need explain your refine process."
    "If the context is not useful, return the original answer.[/INST]"

)
mistral_summary_template_str =  (
    "<s>[INST]"
    "You are an intelligent AI assistant could help users analyze document info, must meet below requirements:\n"
    "1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "2.When you answer query, if possible please also give some source info you used to generate answer.[/INST]\n"
    "[INST]Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Query: {query_str}[/INST]"
)


query_gen_template_str = (
    "<s>[INST] <<SYS>>"
    "You are a smart helpful assistant that generates multiple search queries based on a "
    "single input query. Generate {num_queries} search queries, one on each line, "
    "similar to the following input query:\n"
    "<</SYS>>\n"
    "Query: {query}\n"
    "Queries: [/INST]"
)
summary_query_str = (
    "Write the concise summary about the provided context information. "
    "Also provide some of the actual questions that this context information can answer."
    "Noted: not need provide the answer for questions."
)

# llama2 format use for create index stage
document_summary_template_str = (
    "<s>[INST] <<SYS>>"
    "You are a smart AI assistant could help user analyze document info must meet below requirement:\n"
    "1.Not care about document metadata info on context information like:page_label, file_path，the content of the document is what you must to focus on.\n"
    "2.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.\n"
    "3.Don't explain your answer, Please give the answer to the user's query directly.\n"
    "4.Never provide questions about document metadata info like:page_label, file_path, file_name.\n"
    "<</SYS>>\n"
    "Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Query: {query_str}\n"
    "Answer: [/INST]"
)

title_node_template_str = """<s>[INST] <<SYS>>You are an intelligent AI assistant could help users analyze document information, must meet the following requirements:
1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info..
2.Don't explain your answer, Please give the answer to the user's query directly.
<</SYS>>
Context information from multiple sources is below.
---------------------
{context_str}
---------------------
Query:Give a title that summarizes all of the unique entities, titles or themes found in the context. 
Title: [/INST]"""

title_combine_template_str = """<s>[INST] <<SYS>>You are an intelligent AI assistant could help users analyze document information, must meet the following requirements:
1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.
2.Don't explain your answer, Please give the answer to the user's query directly.
<</SYS>>
Context information from multiple sources is below.
---------------------
{context_str}
---------------------
Query:Based on the above candidate titles and content, what is the comprehensive title for this document?
Title: [/INST]"""


question_template_str = """<s>[INST] <<SYS>>You are an intelligent AI assistant could help users analyze document information, must meet the following requirements:
1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.
2.Don't explain your answer, Please give the answer to the user's query directly.
<</SYS>>
Context information from multiple sources is below.
---------------------
{context_str}
---------------------
Query:Just generate {num_questions} actual questions this context can provide specific answers to which are unlikely to be found elsewhere. Noted: not need provide the answer for questions.
Questions: [/INST]"""

mistral_question_template_str = """<s>[INST] You are an intelligent AI assistant could help users analyze document information, must meet the following requirements:
1.You do not have prior knowledge about document that user provided,just answer user query base on provided document information, and not provide fake info.
2.Don't explain your answer, Please give the answer to the user's query directly.[INST]</s>
[INST]Context information from multiple sources is below.
---------------------
{context_str}
---------------------
Query:Just generate {num_questions} actual questions this context can provide specific answers to which are unlikely to be found elsewhere. Noted: not need provide the answer for questions.
Questions: [/INST]"""

query_gen_template = PromptTemplate(query_gen_template_str)
document_summary_template = PromptTemplate(document_summary_template_str)


def get_text_qa_template(model) -> PromptTemplate:
    if model.startswith('mistral'):
        return PromptTemplate(mistral_text_qa_template_str)
    else:
        return PromptTemplate(text_qa_template_str)


def get_summary_template(model) -> PromptTemplate:
    if model.startswith('mistral'):
        return PromptTemplate(mistral_summary_template_str)
    else:
        return PromptTemplate(summary_template_str)


def get_refine_template(model) -> PromptTemplate:
    if model.startswith('mistral'):
        return PromptTemplate(mistral_refine_template_str)
    else:
        return PromptTemplate(refine_template_str)


def get_question_template(model) -> str:
    if model.startswith('mistral'):
        return mistral_question_template_str
    else:
        return question_template_str
