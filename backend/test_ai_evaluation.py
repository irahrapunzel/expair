import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from django.db import models
from rest_framework.test import APIClient
from accounts.models import User, TradeRequest, TradeDetail, Evaluation

print("=== Testing TE1: Trade Evaluation Storage ===\n")

# Get test user
user = User.objects.first()
print(f"✅ Using user: {user.username} (ID: {user.pk})\n")

# Find a trade with 2 details
trades_with_details = TradeRequest.objects.annotate(
    detail_count=models.Count('tradedetail')
).filter(detail_count=2)

print(f"📊 Trades with 2 details: {trades_with_details.count()}")

if trades_with_details.count() == 0:
    print("⚠️ No trades with 2 details found.")
    print("   Both parties must submit trade details before evaluation can work.")
    print("\n💡 To test TE1, you need:")
    print("   1. A TradeRequest with both requester and responder set")
    print("   2. Two TradeDetail records (one for each party)")
    exit()

trade = trades_with_details.first()
details = TradeDetail.objects.filter(trade_request=trade)

print(f"   Testing with trade: {trade.reqname} (ID: {trade.pk})")
print(f"   Requester: {trade.requester.username}")
print(f"   Responder: {trade.responder.username if trade.responder else 'None'}")
print(f"   Details: {details.count()}/2\n")

# Create authenticated client
client = APIClient()
client.force_authenticate(user=user)

print("1️⃣ Calling Evaluate Endpoint...")
response = client.post(
    '/api/ai/evaluate/',
    {'tradereq_id': trade.pk},
    format='json'
)

print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ Evaluation Saved Successfully!")
    print(f"\n📊 Overall Score: {data['overall_score_out_of_10']}/10")
    print(f"   Quality: {data['quality_label']}")
    print(f"\n📏 Individual Metrics:")
    print(f"   • Task Complexity:  {data['taskcomplexity_out_of_10']}/10")
    print(f"   • Time Commitment:  {data['timecommitment_out_of_10']}/10")
    print(f"   • Skill Level:      {data['skilllevel_out_of_10']}/10")
    print(f"\n💭 What we think:")
    print(f"   {data['evaluationdescription']}")
    print(f"\n🔄 New evaluation: {data['created']}")
    
    # Verify in database
    eval_obj = Evaluation.objects.get(trade_request_id=trade.pk)
    print(f"\n✅ Verified in database:")
    print(f"   Evaluation ID: {eval_obj.evaluation_id}")
    print(f"   Overall (raw): {eval_obj.overall_score}/100")
    
else:
    print(f"❌ Error: {response.json()}")

print("\n✅ TE1 test complete!")