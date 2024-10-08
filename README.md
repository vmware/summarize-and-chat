<div align='center'> <h1>Summarize and Chat</h1> </div>

This repository contains the source code for the summarize-and-chat project. This project provides a unified document summarization and chat framework with LLMs, aiming to address the challenges of building a scalable solution for document summarization while facilitating natural language interactions through chat interfaces. 

Core features include:

- Support a range of document lengths and formats (PDF, DOCX, PPTX, TXT, VTT, VTT, Audio) and accommodate various types of content
- Support open source LLMs on OpenAI-compatible LLM inference engine
- An intuitive user interface for file upload, summary generation, and chat
- Summarization:
  - Insert, paste or upload your files & preview files
  - Pick the way you want to summarize (allow user to provide custom prompts, chunk size, page range for docs or time range for audio)
  - Adjust your summary length
  - Get your summary in seconds and download your summary
- Chat with your doc - ask any question based on your doc for enhanced analysis
  - Auto-generated questions from the doc
  - Get the answer with the source in seconds
- Insight Analysis
  - Select two or more docs
  - Write the prompt to compare or identify the insights from the selected docs
- Speech-to-text convention 
- Support PDF parsers: PyPDF, PDFMiner, PyMUPDF  
- APIs - Cohere's summarize API compatible 
<br>

## Disclaimer
Be aware that LLMs pose inherent vulnerabilities and risks, as illustrated by the [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/). We strongly encourage customers to pay attention to OWASP guidance and the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) to build safe and robust AI systems.

## What is included

Summarize-and-chat project includes three components:

- summarization-client: Angular/Clarity web application for content management, summary generation and chat.
- summarization-server: FastAPI gateway server to manage core application functions including access control, document ingestion pipeline,summarization with [LangChain](https://python.langchain.com/v0.2/docs/introduction/), and improved RAG with [LlamaIndex](https://docs.llamaindex.ai/en/stable/) from a PGVector Store.
- stt-service (speech-to-text): A microservice to convert audio to text using OpenAI’s [faster-whisper](https://github.com/SYSTRAN/faster-whisper)

## Quick start

- For development environment and build configuration see [build documentation](BUILD.md)

## Contributing

Summarize-and-chat project team welcomes contributions from the community. Before you start working with Summarize-and-chat project, please
read our [Contributor License Agreement](https://cla.vmware.com/cla/1/preview). All contributions to this repository must be
signed as described on that page. Your signature certifies that you wrote the patch or have the right to pass it on
as an open-source patch. For more detailed information, refer to [CONTRIBUTING.md](CONTRIBUTING_CLA.md).

## Bugs and feature requests

Have a bug or a feature request? Please first read the issue guidelines and search for existing and closed issues. If your problem or idea is not addressed yet, please open a new issue.
<br>

## Copyright and license

Copyright 2024-2025 VMware, Inc.
SPDX-License-Identifier: Apache-2.0.

The project is [licensed](https://github.com/vmware-ai-labs/VMware-generative-ai-reference-architecture/blob/main/LICENSE) under the terms of the Apache 2.0 license.