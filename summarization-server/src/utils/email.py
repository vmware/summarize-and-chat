# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from src.utils.summary_store import get_summary_history
from src.config import logger
from src.utils.env import _env

config = _env.get_email_values()

def send_email(subject, htmlTemplate, to):
    return None
    # s = smtplib.SMTP(config['SMTP_SERVER'])
    # message = MIMEText(htmlTemplate, "html")
    # message['From'] = config['SENDER']
    # message['To'] = to
    # message['Subject'] = subject
    # try:
    #     # s.login("svc.instaml", "cxYt4P34dx!9^F^.@LB")
    #     s.sendmail(message['From'], message['To'], message.as_string())
    #     s.quit()
    #     return None
    # except smtplib.SMTPRecipientsRefused:
    #     return "Error: sendmail recipient refused"


def notify_vtt_finished(user, audio):
    logger.info(f'------sned email------{user},{audio}')
    template = Path('./src/config/template-vtt.html')
    htmlTemplate = ""
    with open(template, 'r', encoding='UTF-8') as f1:
        htmlTemplate = f1.read()
    f1.close()
    htmlTemplate= htmlTemplate.replace("${user}", user)
    htmlTemplate = htmlTemplate.replace("${audio}", audio)
    htmlTemplate = htmlTemplate.replace("${link}", f"{config['SUMMARIZER_URL']}/nav/files")
    subject = "Audio convert to vtt finished"
    toAddresses = user
    return send_email(subject, htmlTemplate, toAddresses)


def notify_summary_finished(user, document, subject=None):
    if document:
        logger.info(f'------sned email------{user},{document}')
        template = Path('./src/config/template-summary.html')
        htmlTemplate = ""
        with open(template, 'r', encoding='UTF-8') as f1:
            htmlTemplate = f1.read()
        f1.close()
        summary = get_summary_history(user,document)
        htmlTemplate= htmlTemplate.replace("${user}", user)
        htmlTemplate = htmlTemplate.replace("${summary}", summary)
        htmlTemplate = htmlTemplate.replace("${document}", document)
        htmlTemplate = htmlTemplate.replace("${link}", f"{config['SUMMARIZER_URL']}/nav/files")
        if not subject:
            subject = "Document Summary Completed"
        toAddresses = user
        return send_email(subject, htmlTemplate, toAddresses)
