import os
import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
FROM_EMAIL = os.environ.get("SES_FROM_EMAIL", "no-reply@nxtwave.tech")

def get_ses_client():
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        return None
    return boto3.client(
        'ses',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def send_evaluation_email(to_email: str, instructor_name: str, status: str, remarks: str):
    client = get_ses_client()
    if not client:
        print(f"WARNING: AWS SES credentials not found. Mocking email to {to_email}.")
        return

    subject = f"Grooming Evaluation Status: {status}"
    body_text = f"""Hello {instructor_name},

Your daily grooming evaluation is complete.
Status: {status}
Remarks: {remarks}

Thank you,
NxtWave Administration
"""
    try:
        response = client.send_email(
            Destination={'ToAddresses': [to_email]},
            Message={
                'Body': {'Text': {'Charset': "UTF-8", 'Data': body_text}},
                'Subject': {'Charset': "UTF-8", 'Data': subject},
            },
            Source=FROM_EMAIL,
        )
        print(f"Email sent successfully to {to_email}. Message ID: {response['MessageId']}")
    except ClientError as e:
        print(f"Failed to send email to {to_email}. Error: {e.response['Error']['Message']}")

def send_otp_email(to_email: str, otp: str):
    client = get_ses_client()
    if not client:
        print(f"WARNING: AWS SES credentials not found. Mocking OTP email to {to_email}. OTP: {otp}")
        return

    subject = "Your NxtWave OTP for Password Reset"
    body_text = f"Your OTP for resetting your password is: {otp}\n\nThis OTP is valid for 10 minutes."
    
    try:
        response = client.send_email(
            Destination={'ToAddresses': [to_email]},
            Message={
                'Body': {'Text': {'Charset': "UTF-8", 'Data': body_text}},
                'Subject': {'Charset': "UTF-8", 'Data': subject},
            },
            Source=FROM_EMAIL,
        )
        print(f"OTP Email sent successfully to {to_email}. Message ID: {response['MessageId']}")
    except ClientError as e:
        print(f"Failed to send OTP email to {to_email}. Error: {e.response['Error']['Message']}")

def send_export_email(to_email: str, csv_content: str, filename: str = "daily_records.csv"):
    client = get_ses_client()
    if not client:
        print(f"WARNING: AWS SES credentials not found. Mocking Export email to {to_email}.")
        return

    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication

    msg = MIMEMultipart()
    msg['Subject'] = "NxtWave Daily Records Export"
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email

    body = MIMEText("Please find the requested Daily Records export attached.", 'plain')
    msg.attach(body)

    attachment = MIMEApplication(csv_content.encode('utf-8'))
    attachment.add_header('Content-Disposition', 'attachment', filename=filename)
    msg.attach(attachment)

    try:
        response = client.send_raw_email(
            Source=FROM_EMAIL,
            Destinations=[to_email],
            RawMessage={'Data': msg.as_string()}
        )
        print(f"Export Email sent successfully to {to_email}. Message ID: {response['MessageId']}")
    except ClientError as e:
        print(f"Failed to send Export email to {to_email}. Error: {e.response['Error']['Message']}")

