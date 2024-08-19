# summarization-server

## DEV
```bash
Python 3.8+

cd insight

python3 -m venv .venv   
. .venv/bin/activate    
```

## BUILD
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## RUN
```bash
uvicorn main:app --reload
```

## APIs
    http://127.0.0.1:5000/docs