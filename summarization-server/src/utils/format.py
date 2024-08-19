import re
from typing import List
import webvtt
from langchain.schema import Document
from src.model.data_model import Format,Length


def full_string_to_list(full_string):
    result = full_string.split('\n')
    l = []
    for res in result:
        if re.match("\s*\*", res):
            l.append(re.sub("\s*\*", "", res, count=1).lstrip())
        elif re.match(r"\s*-", res):
            l.append(re.sub(r"\s*-", "", res, count=1).lstrip())
        elif re.match(r"\s*\d+\.", res):
            l.append(re.sub(r"\s*\d+\.", "", res, count=1).lstrip())
    # List de-duplication
    l = list(set(l))
    return l


def read_vtt(filepath, start, end):
    start_range = start.split(':')
    end_range = end.split(':')
    start_in_seconds = float(start_range[0]) * 3600 + float(start_range[1]) * 60 + float(start_range[2])
    end_in_seconds = float(end_range[0]) * 3600 + float(end_range[1]) * 60 + float(end_range[2])
    docs = []
    page_content = ""
    for caption in webvtt.read(filepath):
        if len(caption.text) > 0 and caption.start_in_seconds >= start_in_seconds and caption.end_in_seconds <= end_in_seconds:
            page_content += caption.text + '\n'
    docs.append(Document(page_content=page_content))
    return docs


def docs_pages(docs: List[Document], start_index: int, end_index: int):
    page_content = {}
    new_docs = []
    for d in docs:
        if 'page_number' in d.metadata:
            key = str(d.metadata['page_number'])
            if key in page_content:
                page_content[key] = page_content[key] + '\n\n' + d.page_content
            else:
                page_content[key] = d.page_content
    for key, value in page_content.items():
        doc = Document(page_content=value)
        new_docs.append(doc)
    return new_docs[start_index:end_index]


# combine all pages document to one document
# text_splitter.split_documents() split base on document not all the pages
def pages_to_document(pages: List[Document]):
    docs = []
    page_content = ''
    for page in pages:
        page_content = page_content + page.page_content + '\n\n\n\n'
    docs.append(Document(page_content=page_content))
    return docs


# add length and format in prompt
def response_format(origin_prompt:str, format:Format, length:Length):
    format_str = ""
    length_str = ""
    if format is Format.bullets:
        format_str = "Format your answer as bullets."
    elif format is Format.paragraph:
        format_str = "Format your answer as paragraph."
    if length is Length.short:
        length_str = "Generate your answer with 100 words or less."
    elif length is Length.medium:
        length_str = "Generate your answer with 200 words or less."
    elif length is Length.long:
        length_str = "Generate your answer with 300 words or less."

    origin_prompt = origin_prompt + length_str + format_str
    return origin_prompt