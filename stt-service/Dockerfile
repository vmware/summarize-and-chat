FROM nvidia/cuda:11.6.1-cudnn8-runtime-ubuntu20.04

WORKDIR /app
COPY . .

ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

RUN apt-get update -y &&\
    apt-get install -y --no-install-recommends apt-utils &&\
    apt-get install -y ffmpeg  &&\
    apt-get install -y frei0r-plugins &&\ 
    apt install software-properties-common -y  &&\
    add-apt-repository ppa:deadsnakes/ppa &&\
    python3 --version &&\
    apt install python3-pip -y &&\
    python3 -m pip install --upgrade pip &&\
    pip install -r requirements.txt &&\
    pip list

CMD [ "python3", "main.py" ]