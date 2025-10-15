"""
Auto-categorize trades when they're created or updated
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import TradeRequest
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=TradeRequest)
def auto_categorize_on_save(sender, instance, created, **kwargs):
    """
    Auto-categorize trade request when it's created.
    Runs in background to avoid blocking the request.
    """
    # Only categorize new trades or trades without category
    if created or not instance.classified_category:
        try:
            from ai.services.classifier import categorize_tradereq
            category = categorize_tradereq(instance.tradereq_id)
            if category and category != instance.classified_category:
                instance.classified_category = category
                instance.save(update_fields=['classified_category'])
                logger.info(f"Auto-categorized trade {instance.tradereq_id}: {instance.reqname} → {category}")
        except Exception as e:
            logger.warning(f"Failed to auto-categorize trade {instance.tradereq_id}: {e}")


def auto_categorize_uncategorized_trades():
    """
    Standalone function to batch-categorize trades without a category.
    Called manually or from explore feed view.
    NOT a signal receiver.
    """
    try:
        # Find trades without category
        uncategorized = TradeRequest.objects.filter(
            Q(classified_category__isnull=True) | Q(classified_category='')
        ).filter(
            Q(status='PENDING') | Q(status__isnull=True)
        )[:50]  # Process 50 at a time
        
        if not uncategorized:
            return 0
        
        from ai.services.classifier import categorize_tradereq
        
        categorized_count = 0
        for trade in uncategorized:
            try:
                category = categorize_tradereq(trade.tradereq_id)
                if category:
                    categorized_count += 1
                    logger.info(f"Batch-categorized trade {trade.tradereq_id}: {trade.reqname} → {category}")
            except Exception as e:
                logger.warning(f"Failed to categorize trade {trade.tradereq_id}: {e}")
                continue
        
        return categorized_count
        
    except Exception as e:
        logger.error(f"Error in auto_categorize_uncategorized_trades: {e}")
        return 0