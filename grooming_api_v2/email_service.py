import os
import smtplib
from email.message import EmailMessage

BREVO_SMTP_SERVER = "smtp-relay.brevo.com"
BREVO_SMTP_PORT = 587
BREVO_SMTP_LOGIN = os.environ.get("BREVO_SMTP_LOGIN")
BREVO_SMTP_PASSWORD = os.environ.get("BREVO_SMTP_PASSWORD")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "no-reply@nxtwave.tech")

def send_evaluation_email(to_email: str, instructor_name: str, status: str, remarks: str):
    if not BREVO_SMTP_LOGIN or not BREVO_SMTP_PASSWORD:
        print(f"WARNING: Brevo SMTP credentials not found. Mocking email to {to_email}.")
        print(f"--- MOCK EMAIL ---")
        print(f"To: {to_email}")
        print(f"Subject: Grooming Evaluation Status: {status}")
        print(f"Hello {instructor_name},\nYour grooming evaluation is complete. Status: {status}\nRemarks: {remarks}")
        print(f"------------------")
        return

    msg = EmailMessage()
    msg['Subject'] = f"Grooming Evaluation Status: {status}"
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg.set_content(f"""
    Hello {instructor_name},
    
    Your daily grooming evaluation is complete.
    Status: {status}
    Remarks: {remarks}
    
    Thank you,
    NxtWave Administration
    """)

    try:
        with smtplib.SMTP(BREVO_SMTP_SERVER, BREVO_SMTP_PORT) as server:
            server.starttls()
            server.login(BREVO_SMTP_LOGIN, BREVO_SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}. Error: {e}")
