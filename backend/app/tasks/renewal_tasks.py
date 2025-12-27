"""
Tâches Celery pour les rappels de renouvellement d'abonnement.
"""
from celery import shared_task
import logging
from datetime import datetime

from app.db.session import async_session_maker
from app.services.renewal_service import renewal_reminder_service
from app.services.email_service import send_email

logger = logging.getLogger(__name__)


@shared_task(name="send_renewal_reminders")
def send_renewal_reminders_task(days_before: int = 7):
    """
    Tâche Celery pour envoyer des rappels de renouvellement.
    À exécuter quotidiennement via Celery Beat.
    
    Args:
        days_before: Nombre de jours avant l'expiration pour envoyer le rappel
    """
    import asyncio
    
    async def _send_reminders():
        async with async_session_maker() as db:
            users = await renewal_reminder_service.get_users_needing_renewal_reminder(
                db, days_before_expiration=days_before
            )
            
            sent_count = 0
            failed_count = 0
            
            for user in users:
                try:
                    # Calculer les jours restants
                    if user.subscription_expires_at:
                        days_remaining = (user.subscription_expires_at - datetime.utcnow()).days
                    else:
                        continue
                    
                    # URL de renouvellement
                    renewal_url = f"https://footintel.com/pricing?renew={user.subscription}"
                    
                    # Générer l'email
                    subject = renewal_reminder_service.get_renewal_email_subject(lang='fr')
                    body = renewal_reminder_service.get_renewal_email_body(
                        user=user,
                        days_remaining=days_remaining,
                        renewal_url=renewal_url,
                        lang='fr'
                    )
                    
                    # Envoyer l'email (via tâche Celery)
                    send_email.delay(
                        to_email=user.email,
                        subject=subject,
                        html_content=body
                    )
                    
                    sent_count += 1
                    logger.info(f"Renewal reminder sent to {user.email} ({days_remaining} days remaining)")
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Failed to send renewal reminder to {user.email}: {e}")
            
            logger.info(f"Renewal reminders: {sent_count} sent, {failed_count} failed")
            return {"sent": sent_count, "failed": failed_count}
    
    return asyncio.run(_send_reminders())


@shared_task(name="downgrade_expired_subscriptions")
def downgrade_expired_subscriptions_task():
    """
    Tâche Celery pour downgrader les abonnements Mobile Money expirés.
    À exécuter quotidiennement via Celery Beat.
    """
    import asyncio
    
    async def _downgrade():
        async with async_session_maker() as db:
            count = await renewal_reminder_service.downgrade_expired_subscriptions(db)
            logger.info(f"Downgraded {count} expired Mobile Money subscriptions")
            return {"downgraded": count}
    
    return asyncio.run(_downgrade())


@shared_task(name="send_expiration_warning")
def send_expiration_warning_task():
    """
    Tâche pour envoyer des avertissements multiples avant expiration.
    Envoie des rappels à 7 jours, 3 jours, et 1 jour avant expiration.
    """
    results = {}
    
    # 7 jours avant
    results['7_days'] = send_renewal_reminders_task(days_before=7)
    
    # 3 jours avant
    results['3_days'] = send_renewal_reminders_task(days_before=3)
    
    # 1 jour avant
    results['1_day'] = send_renewal_reminders_task(days_before=1)
    
    return results
