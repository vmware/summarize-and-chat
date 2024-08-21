# Summarize-and-Chat project build and development setup

The project includes three components:

- [**_summarization-client_**](./summarization-client): Angular/Clarity web application for content management, summary generation and chat.
- [**_summarization-server_**](./summarization-server): FastAPI gateway server to manage core application functions including access control, document ingestion pipeline,summarization with Map Reduce provided by [LangChain](https://python.langchain.com/v0.2/docs/introduction/), and improved RAG with [LlamaIndex Fusion Retriever](https://docs.llamaindex.ai/en/stable/examples/retrievers/reciprocal_rerank_fusion/).
- [**_stt-service_**](./stt-service): Speech-to-text microservice to convert audio to text using OpenAI’s faster-whisper API

## Tools used

Building requires:

- [Angular CLI = 16.1.4.](https://github.com/angular/angular-cli)
- [Python  = 3.10+] (https://www.python.org/downloads/)
- [PGVector = 12+](https://github.com/pgvector/pgvector)

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

- Set up LLM configuration

```yaml
llm:
  LLM_API: "your LLM api server" # https://api.openai.com/v1"
  AUTH_KEY: "your api key"
  QA_MODEL: "default QA model" #mistralai/Mixtral-8x7B-Instruct-v0.1"
  QA_MODEL_MAX_TOKEN_LIMIT: "max token limit for QA model" #30000
  SUMMARIZE_MODEL: "default model for summarization task" #"meta-llama/Meta-Llama-3-70B-Instruc"
  EMBEDDING_MODEL: "embedding model" #"Salesforce/SFR-Embedding-Mistral"
  VECTOR_DIM: "embedding model vector dimension" #4096
  MAX_COMPLETION: "max tokens of completion for each query" #700
  CHUNK_SIZE: "default chunk size" #512
  CHUNK_OVERLAP: "default chunk overlap" # 20
  NUM_QUERIES: "default number of queries" #10
  TOP_K: "retriever top k docs" # 5
  LLM_BATCH_SIZE: "batch size for LLM" # 1
  AUDIO_API: "stt-service URL" #"http://localhost:9000/api/v1"
```

You also need to specify the available LLMs in the [summarization-server/src/config/models.json](./summarization-server/src/config/models.json).

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
  RELOAD: False
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
