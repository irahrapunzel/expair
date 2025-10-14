"""
Auto-categorize trades when they're created or updated
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import TradeRequest


@receiver(post_save, sender=TradeRequest)
def auto_categorize_trade(sender, instance, created, **kwargs):
    """
    Automatically categorize trade when created or when reqname changes.
    Runs after trade is saved to database.
    """
    # Only categorize if:
    # 1. It's a new trade (created=True), OR
    # 2. Trade name exists but category is missing
    if created or (instance.reqname and not instance.classified_category):
        # Import here to avoid circular imports
        from ai.services.classifier import categorize_tradereq
        
        try:
            # Categorize the trade (this will save to DB automatically)
            category = categorize_tradereq(instance.pk)
            print(f"✅ Auto-categorized '{instance.reqname}' → {category}")
        except Exception as e:
            print(f"⚠️ Auto-categorization failed for '{instance.reqname}': {e}")