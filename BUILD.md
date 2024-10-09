# Summarize-and-Chat project build and development setup

The project includes three components:

- [**_summarization-client_**](./summarization-client): Angular/Clarity web application for content management, summary generation and chat.
- [**_summarization-server_**](./summarization-server): FastAPI gateway server to manage core application functions including access control, document ingestion pipeline,summarization with Map Reduce provided by [LangChain](https://python.langchain.com/v0.2/docs/introduction/), and improved RAG with [LlamaIndex](https://docs.llamaindex.ai/en/stable/) from a PGVector Store.
- [**_stt-service_**](./stt-service): Speech-to-text microservice to convert audio to text using OpenAI’s faster-whisper API

## Tools used

Building requires:

- [Angular CLI = 16.1.4.](https://github.com/angular/angular-cli)
- [Python = 3.10+] (https://www.python.org/downloads/)
- [Postgres = 12+](https://github.com/pgvector/pgvector)


## Before You Start

### Running LLM inference engine on vLLM
vLLM is a popular open-source LLM inference engine. To run an open-source LLM on vLLM in OpenAI-compatible mode, make sure you have an A100 (40GB) GPU available at the OS-level and CUDA 12.1 installed. Then you need to run the following commands to make the LLM service available from http://localhost:8010/v1:

```bash
      # (Optional) Create a new conda environment.
      conda create -n vllm-env python=3.9 -y
      conda activate vllm-env

      # Install vLLM with CUDA 12.1.
      pip install vllm

      # Serve the zephyr-7b-alpha LLM
      python -m vllm.entrypoints.openai.api_server --model HuggingFaceH4/zephyr-7b-alpha --port 8010 --enforce-eager
```

### Running PGVector
The vector store is implemented using the PGVector extension of PostgreSQL (v12).

```bash
$ cd summarization-server/pgvector
$ run the `docker compose up -d` script to launch a PGVector instance using Docker Compose.

The `docker-compose.yaml` file defines the PostgreSQL configuration, which you can customize according to your preferences.

You can execute the run_pgvector.sh script to pull and launch a PostgreSQL + PGVector Docker container. Once up and running, the DB engine will be available from localhost:5432
```

## Installation

```bash
# clone the repo
$ git clone https://github.com/vmware/summarize-and-chat

# install summarization-client
$ cd summarization-client
$ npm install

# install summarization-server
$ cd summarization-server
$ python3 -m venv .venv   # create a virtual environments
$ source .venv/bin/activate    # windows: .venv\Scripts\activate
$ pip install -r requirements.txt

# install stt-service
$ cd stt-service
$ python3 -m venv .venv   # create a virtual environments
$ source .venv/bin/activate    # windows: .venv\Scripts\activate
$ pip install -r requirements.txt 

```

## Configuration

### summarization-client

You need to set the following required variables in the [summarization-client/src/environments/environment.ts](./summarization-client/src/environments/environment.ts) file to run the summarization-client locally.

```javascript
export const environment: Env = {
  // This section is required
  production: false,
  // Sumarization service url
  serviceUrl: "http://localhost:8000",
  // Okta authentication server
  ssoIssuer: "https://your-org.okta.com/oauth2/default", 
  // Okta client ID
  ssoClientId: 'your-okta-client-id', 
  // Login redirect URL
  redirectUrl:'http://localhost:4200/login/'
  
};
```

To configure specific environments for dev, staging, production, go to summarization-client/src/environments folder and set variables in different environments. 

---

### summarization-server

You need to set the following required variables in the [summarization-server/src/config/config.yaml](./summarization-server/src/config/config.yaml) file to run the summarization-server locally.

- Set up Okta configuration

```yaml
okta:
  OKTA_AUTH_URL: "Okta auth URL"
  OKTA_CLIENT_ID: "Okta client ID"
  OKTA_ENDPOINTS: [ 'admin' ]
```

- Set up Summarization model configuration

```yaml
summarization_model:
  API_BASE: "LLM api base for summarization task" 
  API_KEY: "api key"
  MAX_COMPLETION: 700
  BATCH_SIZE: 1
  MODELS_JSON: "src/config/models.json" # models for summarization task
```

You can specify the available LLMs for the summarization task in the [summarization-server/src/config/models.json](./summarization-server/src/config/models.json).

```json
{
    "models": [
        {
            "name": "meta-llama/Meta-Llama-3-70B-Instruct",
            "display_name": "LLAMA 3 - 70B",
            "max_token": 6500
        },
        {
            "name": "meta-llama/Meta-Llama-3.1-70B-Instruct",
            "display_name": "LLAMA 3.1 - 70B",
            "max_token": 128000
        },
        {
            "name": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "display_name": "Mixtral - 8x7B",
            "max_token": 30000
        },
        {
            "name": "mistralai/Mistral-7B-Instruct-v0.2",
            "display_name": "Mistral - 7B",
            "max_token": 30000
        }
    ]
}
```

- Set up QA models configuration

```yaml
qa_model:
  API_BASE: "LLM api base for QA model"
  API_KEY: "api key"
  MODEL: "mistralai/Mixtral-8x7B-Instruct-v0.1"
  MAX_TOKEN: 1024
  MAX_COMPLETION: 700
  SIMIL_TOP_K: 10 # Retrieve TOP_K most similar docs from the PGVector store
  CHUNK_SIZE: 512
  CHUNK_OVERLAP: 20
  NUM_QUERIES: 3
```

```yaml
embedder:
  API_BASE: "LLM api base for embedding model"
  API_KEY: "api key"
  MODEL: "nvidia/nv-embedqa-e5-v5"
  VECTOR_DIM: 1024
  BATCH_SIZE: 16
```

```yaml
reranker:
  API_BASE: "LLM api base for reranker model"
  API_KEY: NONE
  MODEL: "nvidia/nv-rerankqa-mistral-4b-v3" # "BAAI/bge-reranker-large"
  RERANK_TOP_N: 5 # Rerank and pick the 5 most similar docs
```

- Set up Database configuration

```yaml
database:
  PG_HOST: "Database host" #"localhost"
  PG_PORT: 5432
  PG_USER: DB_USER
  PG_PASSWD: DB_PASSWORD
  PG_DATABASE: "your database name" #summerizer
  PG_TABLE: "pgvector embedding table" #embeddings
  PG_VECTOR_DIM: "your embedding model vector dimension" # match the vector dimension of the embedding model
```

- Set up server configuration

```yaml
server:
  HOST: "0.0.0.0"
  PORT: 5000
  NUM_WORKERS: 1
  PDF_READER: pypdf # default PDF parser
  FILE_PATH:  "../data"
  RELOAD: True
  AUTH: okta
```

- If you are want to enable Speech-to-text function, you need to set stt configurations in the [summarization-server/src/config/config.yaml](./summarization-server/src/config/config.yaml) file.

```yaml
stt:
  STT_API: "http://localhost:9000/api/v1" # STT-server URL
  AUTH_KEY: "your STT api auth key if the auth is enabled"
```

- If you are want to enable email notifications, you need to set email server configurations in the [summarization-server/src/config/config.yaml](./summarization-server/src/config/config.yaml) file.

```yaml
email:
  SMTP_SERVER: "your smtp server"
  SMTP_SENDER: "your sender email"
```

---

### stt-service

- If you are a personal user, and just run the code on the local machine, you can use the default settings, don't need to set up any configs.
- If you are an organization user and want to deploy code to the server, we recommend you set the following required variables and some optional variables in [stt-service/config/config.yaml](./stt-service/config/config.yaml) file to run the stt-service.

- Set the following required auth variables if you enable authentication.

```yaml
auth:
  ENABLED: True
  AUTH_URL: "your api auth url"
  CACHE_TIMEOUT: 86400 #  1 day
```

- Set the model variables if you want to use a different model or run on GPU device.

```yaml
model:
  MODEL_SIZE: "small"
  COMPUTE_TYPE: "int8"
  DEVICE: "cpu" # "cuda" if on GPU
  DEVICE_INDEX: 1
```

- Set the server variables 

```yaml

server:
  HOST: "0.0.0.0"
  PORT: 9000
  SERVER_WORKERS: 1
  MAX_WORKS: 3
  RELOAD: False
  DEVICE_INDEX: 1
  CPU_THREADS: 1
  NUM_WORKERS: 1
  FILE_PATH: "file_path same as summarization-server"
  SUMMARIZATION_SERVER: "summarization-server URL for notification" #"http://localhost:8000"
  AUDIO_SIZE_LIMITE: "audio file size limit" # 50*1024*1024
```

## Run at Local

After the installation and configuration, you can run the Summarize-and-chat application as follow:

```bash
# run summarization-client
$ cd summarization-client
$ ng serve

# run summarization-server
$ cd summarization-server
$ uvicorn main:app --reload

# run stt-service
$ cd stt-service
$ uvicorn main:app --reload

```


## How to use

Open `http://localhost:4200` with your browser, now you can use full of the Summarize-and-Chat application functions.
