import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai.services.classifier import categorize_tradereq
from accounts.models import TradeRequest

print("=== Testing AI Classifier ===")

# Get first trade
trade = TradeRequest.objects.first()

if trade:
    print(f"\n📦 Testing with trade: {trade.reqname}")
    print(f"   Trade ID: {trade.tradereq_id}")
    
    try:
        category = categorize_tradereq(trade.tradereq_id)
        print(f"\n✅ SUCCESS!")
        print(f"   Category: {category}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("\n⚠️ No trades found in database")
    print("   Create a TradeRequest first in your app")