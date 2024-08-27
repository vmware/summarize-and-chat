# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from src.utils.env import _env

# langchain
def pdf_loader(doc_path):
    loader = None
    server_config = _env.get_server_values()
    if server_config['PDF_READER'] == 'pypdf':
        from langchain.document_loaders import PyPDFLoader
        loader = PyPDFLoader(doc_path)
    elif server_config['PDF_READER'] == 'pymupdf':
        from langchain.document_loaders import PyMuPDFLoader
        loader = PyMuPDFLoader(doc_path)
    elif server_config['PDF_READER'] == 'pdfminer':
        from src.model.pdfloader import PDFMinerLoader
        loader = PDFMinerLoader(doc_path)
    return loader


# llamaindex
def pdf_extractor():
    extractor = None
    server_config = _env.get_server_values()
    if server_config['PDF_READER'] == 'pypdf':
        from llama_index.readers.file import PDFReader
        extractor = PDFReader()
    elif server_config['PDF_READER'] == 'pymupdf':
        from src.model.pdfreader import PyMuPDFReader
        extractor = PyMuPDFReader()
    elif server_config['PDF_READER'] == 'pdfminer':
        from src.model.pdfreader import PDFMinerReader
        extractor = PDFMinerReader()
    return extractor