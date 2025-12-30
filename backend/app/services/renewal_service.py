"""
Service pour gérer les rappels de renouvellement d'abonnement.
Spécifique aux paiements Mobile Money (Moneroo) qui nécessitent un renouvellement manuel.
"""
from datetime import datetime, timedelta
from typing import List
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.user import User, SubscriptionType
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class RenewalReminderService:
    """Service pour envoyer des rappels de renouvellement."""
    
    @staticmethod
    async def get_users_needing_renewal_reminder(
        db: AsyncSession,
        days_before_expiration: int = 7
    ) -> List[User]:
        """
        Récupère les utilisateurs qui ont besoin d'un rappel de renouvellement.
        
        Critères:
        - Abonnement actif (Starter ou Pro)
        - Méthode de paiement = 'moneroo' (renouvellement manuel)
        - Expire dans X jours
        - Pas lifetime (pas besoin de renouvellement)
        """
        expiration_threshold = datetime.utcnow() + timedelta(days=days_before_expiration)
        
        query = select(User).where(
            and_(
                User.subscription.in_([SubscriptionType.STARTER.value, SubscriptionType.PRO.value]),
                User.payment_method == 'moneroo',
                User.subscription_expires_at.isnot(None),
                User.subscription_expires_at <= expiration_threshold,
                User.subscription_expires_at > datetime.utcnow()  # Pas encore expiré
            )
        )
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        logger.info(f"Found {len(users)} users needing renewal reminder ({days_before_expiration} days before expiration)")
        return list(users)
    
    @staticmethod
    async def get_expired_moneroo_subscriptions(db: AsyncSession) -> List[User]:
        """
        Récupère les utilisateurs dont l'abonnement Mobile Money a expiré.
        Ces utilisateurs doivent être downgradés à FREE.
        """
        now = datetime.utcnow()
        
        query = select(User).where(
            and_(
                User.subscription.in_([SubscriptionType.STARTER.value, SubscriptionType.PRO.value]),
                User.payment_method == 'moneroo',
                User.subscription_expires_at.isnot(None),
                User.subscription_expires_at <= now
            )
        )
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        logger.info(f"Found {len(users)} expired Mobile Money subscriptions to downgrade")
        return list(users)
    
    @staticmethod
    async def downgrade_expired_subscriptions(db: AsyncSession) -> int:
        """
        Downgrade tous les abonnements Mobile Money expirés vers FREE.
        Retourne le nombre d'utilisateurs downgradés.
        """
        expired_users = await RenewalReminderService.get_expired_moneroo_subscriptions(db)
        
        count = 0
        for user in expired_users:
            logger.info(f"Downgrading user {user.id} ({user.email}) from {user.subscription} to FREE")
            user.subscription = SubscriptionType.FREE.value
            user.subscription_expires_at = None
            count += 1
        
        if count > 0:
            await db.commit()
            logger.info(f"Successfully downgraded {count} expired Mobile Money subscriptions")
        
        return count
    
    @staticmethod
    def get_renewal_email_subject(lang: str = 'fr') -> str:
        """Retourne le sujet de l'email de rappel."""
        subjects = {
            'fr': "⏰ Votre abonnement FootGenius expire bientôt",
            'en': "⏰ Your FootIntel subscription is expiring soon",
            'de': "⏰ Ihr FootIntel-Abonnement läuft bald ab"
        }
        return subjects.get(lang, subjects['fr'])
    
    @staticmethod
    def get_renewal_email_body(user: User, days_remaining: int, renewal_url: str, lang: str = 'fr') -> str:
        """
        Génère le corps de l'email de rappel.
        
        Args:
            user: L'utilisateur concerné
            days_remaining: Nombre de jours avant expiration
            renewal_url: URL pour renouveler l'abonnement
            lang: Langue de l'email
        """
        templates = {
            'fr': f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #10b981;">Bonjour {user.full_name or user.email} 👋</h2>
                        
                        <p>Votre abonnement <strong>{user.subscription.upper()}</strong> arrive à expiration dans <strong>{days_remaining} jour(s)</strong>.</p>
                        
                        <p>Pour continuer à profiter de toutes les fonctionnalités premium de FootIntel :</p>
                        <ul>
                            <li>Analyses illimitées par IA</li>
                            <li>Assistant IA personnel</li>
                            <li>Support prioritaire</li>
                            <li>Statistiques avancées</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{renewal_url}" 
                               style="background-color: #10b981; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;
                                      font-weight: bold;">
                                Renouveler Mon Abonnement
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            <strong>Note:</strong> Les paiements Mobile Money ne sont pas automatiques. 
                            Vous devez renouveler manuellement votre abonnement avant son expiration.
                        </p>
                        
                        <p>Des questions ? Notre équipe support est là pour vous aider.</p>
                        
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            FootIntel - Analyse IA de Matchs de Football<br>
                            Cet email a été envoyé à {user.email}
                        </p>
                    </div>
                </body>
                </html>
            """,
            'en': f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #10b981;">Hello {user.full_name or user.email} 👋</h2>
                        
                        <p>Your <strong>{user.subscription.upper()}</strong> subscription will expire in <strong>{days_remaining} day(s)</strong>.</p>
                        
                        <p>To continue enjoying all FootIntel premium features:</p>
                        <ul>
                            <li>Unlimited AI analyses</li>
                            <li>Personal AI assistant</li>
                            <li>Priority support</li>
                            <li>Advanced statistics</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{renewal_url}" 
                               style="background-color: #10b981; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;
                                      font-weight: bold;">
                                Renew My Subscription
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            <strong>Note:</strong> Mobile Money payments are not automatic. 
                            You need to manually renew your subscription before it expires.
                        </p>
                        
                        <p>Questions? Our support team is here to help.</p>
                        
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            FootIntel - AI Football Match Analysis<br>
                            This email was sent to {user.email}
                        </p>
                    </div>
                </body>
                </html>
            """
        }
        
        return templates.get(lang, templates['fr'])


# Instance singleton
renewal_reminder_service = RenewalReminderService()
