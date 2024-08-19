FROM python:3.11.2
RUN mkdir /app /.cache /nltk_data
WORKDIR /app
COPY requirements.txt ./
RUN apt-get update -y && apt-get install -y ffmpeg && apt-get install -y unoconv libreoffice libreoffice-java-common default-jre
RUN sed -i 's|#!/usr/bin/env python3|#!/usr/bin/python3|' /usr/bin/unoconv
RUN pip install --upgrade pip && pip install -r requirements.txt
COPY . /app
RUN chown 1000:2000 -R /app /.cache /nltk_data
ENV HOME /app
RUN chmod 777 /app /.cache /nltk_data
EXPOSE 5000
CMD python3 main.py