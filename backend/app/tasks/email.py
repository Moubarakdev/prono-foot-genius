import asyncio
from typing import List, Optional
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from celery import shared_task
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

mail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.smtp_user,
    MAIL_PASSWORD=settings.smtp_password,
    MAIL_FROM=settings.smtp_from,
    MAIL_PORT=settings.smtp_port,
    MAIL_SERVER=settings.smtp_host,
    MAIL_STARTTLS=settings.smtp_tls,
    MAIL_SSL_TLS=settings.smtp_ssl,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=None  # We use plain HTML for now
)

async def _send_email_async(subject: str, recipients: list[str], body: str):
    """Internal async helper for sending emails."""
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html
    )
    
    fm = FastMail(mail_conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Error sending email through FastMail: {e}")
        raise e

@shared_task(name="send_otp_email", autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_otp_email(email: str, otp_code: str, name: str = ""):
    """Task to send an OTP email for account verification or password reset."""
    subject = "FootIntel - Votre code de vérification"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">Vérification de votre compte</h2>
                <p>Bonjour {name},</p>
                <p>Merci de vous être inscrit sur <strong>FootIntel</strong>. Voici votre code de vérification à usage unique (OTP) :</p>
                <div style="text-align: center; margin: 30px 0; padding: 15px; border-radius: 8px; background-color: #f3f4f6; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">
                    {otp_code}
                </div>
                <p>Ce code expirera dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; 2025 FootIntel. Tous droits réservés.</p>
            </div>
        </body>
    </html>
    """
    
    # Celery tasks run in a sync context by default, but FastAPI-Mail is async.
    try:
        asyncio.run(_send_email_async(subject, [email], html_content))
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        raise e

@shared_task(name="send_reset_password_email", autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_reset_password_email(email: str, otp_code: str, name: str = ""):
    """Task to send an OTP email for password reset."""
    subject = "FootIntel - Réinitialisation de votre mot de passe"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">Réinitialisation de mot de passe</h2>
                <p>Bonjour {name},</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe <strong>FootIntel</strong>. Utilisez le code suivant pour procéder :</p>
                <div style="text-align: center; margin: 30px 0; padding: 15px; border-radius: 8px; background-color: #f3f4f6; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">
                    {otp_code}
                </div>
                <p>Ce code expirera dans 10 minutes. Si vous n'avez pas demandé cette réinitialisation, veuillez sécuriser votre compte immédiatement.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; 2025 FootIntel. Tous droits réservés.</p>
            </div>
        </body>
    </html>
    """
    
    try:
        asyncio.run(_send_email_async(subject, [email], html_content))
    except Exception as e:
        logger.error(f"Failed to send reset password email: {e}")
        raise e
