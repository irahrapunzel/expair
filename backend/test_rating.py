import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from accounts.models import User, TradeRequest
from django.utils import timezone

print("=== Testing TR1: Trade Rating with Sentiment Analysis ===\n")

# Get test users
users = User.objects.all()[:2]
if users.count() < 2:
    print("❌ Need at least 2 users")
    exit()

requester = users[0]
responder = users[1]

print(f"👤 Requester: {requester.username} (ID: {requester.pk})")
print(f"👤 Responder: {responder.username} (ID: {responder.pk})\n")

# Find a completed trade
trade = TradeRequest.objects.filter(
    requester=requester,
    responder=responder
).first()

if not trade:
    print("❌ No trade found. Creating one...")
    from datetime import date
    trade = TradeRequest.objects.create(
        requester=requester,
        responder=responder,
        reqname="Test Trade",
        exchange="Test Exchange",
        reqdeadline=date(2025, 12, 31)
    )
    print(f"✅ Created trade ID: {trade.pk}\n")
else:
    print(f"✅ Using trade: {trade.reqname} (ID: {trade.pk})\n")

# Test reviews
test_reviews = [
    {
        "text": "Amazing experience! They delivered exactly what I needed, on time and with great communication. Highly recommend!",
        "expected_stars": 5
    },
    {
        "text": "Good work overall. Met my expectations and was professional throughout the process.",
        "expected_stars": 4
    },
    {
        "text": "It was okay. The work was acceptable but there were some minor issues and delays.",
        "expected_stars": 3
    },
    {
        "text": "Disappointed with the result. Did not meet my expectations and communication was poor.",
        "expected_stars": 2
    },
]

# Create authenticated client (as requester)
client = APIClient()
client.force_authenticate(user=requester)

print("📝 Testing Different Review Sentiments:\n")

for i, review in enumerate(test_reviews, 1):
    print(f"{i}. Review: \"{review['text'][:60]}...\"")
    print(f"   Expected: ~{review['expected_stars']} stars")
    
    response = client.post(
        '/api/ai/submit-rating/',
        {
            'tradereq_id': trade.pk,
            'review_text': review['text']
        },
        format='json'
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ AI Generated: {data['stars']} stars ({data['sentiment']})")
        print(f"      Confidence: {data['confidence']:.2f}")
        print(f"      Partner updated: {data['partner_updated']['username']}")
        print(f"      New avg: {data['partner_updated']['new_avg_stars']:.2f} ⭐")
        
        # FIXED: Use update() instead of save() to avoid datetime warnings
        TradeRequest.objects.filter(pk=trade.pk).update(
            requester_rated=False
        )
        # Refresh the object
        trade.refresh_from_db()
    else:
        print(f"   ❌ Error: {response.json()}")
    
    print()

print("✅ TR1 test complete!")