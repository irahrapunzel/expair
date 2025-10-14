import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Temporarily add testserver to ALLOWED_HOSTS for this test only
from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from accounts.models import User

print("=== Testing AI Endpoints (Authenticated) ===\n")

# Get test user
try:
    user = User.objects.get(username='fjaeeee')
    print(f"✅ Found user: {user.username} (ID: {user.pk})\n")
except User.DoesNotExist:
    print("❌ User 'fjaeeee' not found")
    print("Available users:")
    for u in User.objects.all()[:5]:
        print(f"  - {u.username}")
    exit()

# Create authenticated client
client = APIClient()
client.force_authenticate(user=user)

# Test Onboarding Picks
print("1️⃣ Testing Onboarding Picks...")
response = client.get('/api/ai/onboarding-picks/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Found {len(data.get('best_picks', []))} picks")
    for i, pick in enumerate(data.get('best_picks', [])[:3], 1):
        print(f"  {i}. {pick.get('reqname')} (Score: {pick.get('score', 0):.3f})")
else:
    print(f"❌ Error: {response.json()}")
print()

# Test Explore
print("2️⃣ Testing Explore Feed...")
response = client.get('/api/ai/explore/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Found {len(data.get('trades', []))} trades")
    for i, trade in enumerate(data.get('trades', [])[:3], 1):
        print(f"  {i}. {trade.get('reqname')} (Score: {trade.get('score', 0):.3f})")
else:
    print(f"❌ Error: {response.json()}")
print()

# Test Best Match
print("3️⃣ Testing Best Match...")
response = client.get('/api/ai/best-match/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    best = data.get('best_match')
    if best:
        print(f"✅ Best Match: {best.get('reqname')} (Score: {best.get('score', 0):.3f})")
        print(f"   Breakdown:")
        for k, v in best.get('score_breakdown', {}).items():
            print(f"     - {k}: {v:.3f}")
    else:
        print("ℹ️ No best match found")
else:
    print(f"❌ Error: {response.json()}")
print()

print("✅ All tests complete!")