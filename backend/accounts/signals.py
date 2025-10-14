"""
Auto-categorize trades when they're created or updated
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import TradeRequest
from django.db import transaction
import threading
from ai.services.classifier import categorize_tradereq


@receiver(post_save, sender=TradeRequest)
def auto_categorize_trade(sender, instance, created, **kwargs):
    """
    Automatically categorize trade when created or when reqname changes.
    Runs after trade is saved to database.
    """
    if not (created or (instance.reqname and not instance.classified_category)):
        return

    def _do_categorize(tradereq_id):
        try:
            category = categorize_tradereq(tradereq_id)
            print(f"✅ Auto-categorized '{instance.reqname}' → {category}")
        except Exception as e:
            # don't raise in signal; log and continue
            print(f"⚠️ Auto-categorization failed for id={tradereq_id}: {e}")

    # Run after transaction commit to ensure the object is fully persisted.
    transaction.on_commit(lambda: threading.Thread(target=_do_categorize, args=(instance.pk,), daemon=True).start())