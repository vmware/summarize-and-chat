# stt-service
stt (speech-to-text) service

## DEV
```bash
Python 3.8 # must >= 3.8 as some function 3.7 not working

cd stt-service

python3 -m venv .venv   # windows: py -3 -m venv .venv
. .venv/bin/activate    # windows: .venv\Scripts\activate
```

## BUILD
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## RUN
```bash
cd stt-service/

python3 main  

# for local dev can use: 
# uvicorn main:app --reload
```

## APIs
    http://127.0.0.1:8000/docs
## [APIs examples](api_examples.md)