"""Module contains common parsers for PDFs."""
from typing import List, Iterator

from langchain.document_loaders.base import BaseBlobParser
from langchain.document_loaders.blob_loaders import Blob
from langchain.document_loaders.pdf import BasePDFLoader
from langchain.schema import Document


# PDF parser by PDFMiner lib
# Langchain implementation has no page info, just return all pdf content as long string
class PDFMinerParser(BaseBlobParser):
    """Parse `PDF` using `PDFMiner`."""

    def lazy_parse(self, blob: Blob) -> Iterator[Document]:
        """Lazily parse the blob."""
        from pdfminer.high_level import extract_pages
        from pdfminer.layout import LTTextContainer

        docs = []
        with blob.as_bytes_io() as pdf_file_obj:
            doc = extract_pages(pdf_file_obj)
            for page_num, page_layout in enumerate(doc):
                page_text = ""
                for element in page_layout:
                    if isinstance(element, LTTextContainer):
                        page_text += element.get_text()
                docs.append(Document(
                    page_content=page_text,
                    metadata={"source": blob.source, "page": page_num},
                ))
        yield from docs


class PDFMinerLoader(BasePDFLoader):
    """Load `PDF` files using `PDFMiner`."""

    def __init__(self, file_path: str) -> None:
        """Initialize with file path."""
        try:
            from pdfminer.high_level import extract_pages
            from pdfminer.layout import LTTextContainer
        except ImportError:
            raise ImportError(
                "`pdfminer` package not found, please install it with "
                "`pip install pdfminer.six`"
            )

        super().__init__(file_path)
        self.parser = PDFMinerParser()

    def load(self) -> List[Document]:
        """Eagerly load the content."""
        return list(self.lazy_load())

    def lazy_load(
        self,
    ) -> Iterator[Document]:
        """Lazily load documents."""
        blob = Blob.from_path(self.file_path)
        yield from self.parser.parse(blob)





