from pathlib import Path
import smtplib
from email.mime.text import MIMEText

from src.utils.logger import logger
from src.utils.env import stt_env

def send_email(subject, htmlTemplate, to):
    email_config = stt_env.get_email_values()
    s = smtplib.SMTP(email_config.EMAIL_SMTP_SERVER)
    message = MIMEText(htmlTemplate, "html")
    message['From'] = email_config.EMAIL_SENDER
    message['To'] = to
    message['Subject'] = subject
    try:
        s.sendmail(message['From'], message['To'], message.as_string())
        s.quit()
        return None
    except smtplib.SMTPRecipientsRefused:
        return "Error: sendmail recipient refused"


def notify_vtt_finished(user, audio):
    logger.info(f'notify_vtt_finished {user},{audio}')
    template = Path('./src/templates/template-vtt-finished.html')
    htmlTemplate = ""
    with open(template, 'r', encoding='UTF-8') as f1:
        htmlTemplate = f1.read()
    f1.close()
    htmlTemplate= htmlTemplate.replace("${user}", user)
    htmlTemplate = htmlTemplate.replace("${audio}", audio)
    subject = "Audio convert to vtt finished"
    return send_email(subject, htmlTemplate, user)

def notify_vtt_error(user, audio):
    logger.info(f'notify_vtt_error {user},{audio}')
    template = Path('./src/templates/template-vtt-error.html')
    htmlTemplate = ""
    with open(template, 'r', encoding='UTF-8') as f1:
        htmlTemplate = f1.read()
    f1.close()
    htmlTemplate= htmlTemplate.replace("${user}", user)
    htmlTemplate = htmlTemplate.replace("${audio}", audio)
    subject = "Audio convert to vtt error"
    return send_email(subject, htmlTemplate, user)