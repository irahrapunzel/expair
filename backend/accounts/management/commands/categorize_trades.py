"""
Management command to categorize existing trades that are missing categories
"""

from django.core.management.base import BaseCommand
from accounts.models import TradeRequest
from ai.services.classifier import categorize_tradereq


class Command(BaseCommand):
    help = 'Auto-categorize all trades that are missing categories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Recategorize all trades (even those already categorized)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=== Auto-Categorizing Trades ===\n"))
        
        if options['all']:
            # Recategorize ALL trades
            trades = TradeRequest.objects.all()
            self.stdout.write(f"Recategorizing all {trades.count()} trades...\n")
        else:
            # Only categorize trades with no category
            trades = TradeRequest.objects.filter(classified_category__isnull=True)
            self.stdout.write(f"Found {trades.count()} uncategorized trades\n")
        
        if trades.count() == 0:
            self.stdout.write(self.style.SUCCESS("✅ All trades already categorized!"))
            return
        
        categorized_count = 0
        error_count = 0
        
        for trade in trades:
            self.stdout.write(f"Processing: {trade.reqname} (ID: {trade.pk})")
            
            try:
                category = categorize_tradereq(trade.pk)
                self.stdout.write(self.style.SUCCESS(f"  ✅ Categorized as: {category}"))
                categorized_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))
                error_count += 1
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"✅ Successfully categorized: {categorized_count}"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ Errors: {error_count}"))