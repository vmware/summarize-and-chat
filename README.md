<div align='center'> <h1>Summarize and Chat</h1> </div>

This repository contains the source code for document summarize-and-chat project. The project addresses the complex requirements of building a scalable solution for extracting key information from documents and engaging in natural language conversations with users by providing simple and extensible interfaces and APIs for common document summarization and chat interaction tasks.

Core features include:

- Supports PDF, Microsoft Word, PowerPoint, text and popular audio file types (mp3, mp4, mpeg, mpga, m4a, wav, and webm) and Web Video Text Tracks (VTT) file type.
- Offline Speech-to-text convention and send notification to users when finished
- Summarization:
  - Insert, paste or upload your files & preview files
  - Pick the way you want to summarize (allow user to provide custom prompts, chunk size, page range for docs or time range for audio)
  - Adjust your summary length
  - Get your summary in seconds and download your summary
- Chat with your doc - ask any question based on your doc for enhanced analysis
  - Click Chat icon on the top menu to chat with your doc
  - Pick one of the auto-generated questions from the doc or enter your own question
- Insight Analysis
  - Select two or more docs
  - Write the prompt to compare or identify the insights from the selected docs
  
<br>

## Disclaimer
The scripts provided in this repository are intended to be used for educational purposes but not for production applications. Be aware that LLMs pose inherent vulnerabilities and risks, as illustrated by the [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/). We strongly encourage customers to pay attention to OWASP guidance and the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) to build safe and robust AI systems.

## What is included

Summarize-and-chat project includes three components:

- summarization-client: Angular application for the UI
- summarization-server: FastAPI gateway server to manage core application functions including access control, data handling, powers the UI, and provides APIs
- speech-to-text (stt): A microservice to convert audio to text using OpenAI’s faster-whisper API

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