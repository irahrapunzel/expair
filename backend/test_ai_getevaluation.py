import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from accounts.models import User, Evaluation

print("=== Testing TE2: Retrieve Saved Evaluation ===\n")

# Get test user
user = User.objects.first()
print(f"✅ Using user: {user.username} (ID: {user.pk})\n")

# Get an existing evaluation
evaluation = Evaluation.objects.first()
if not evaluation:
    print("❌ No evaluation found. Run test_ai_evaluation.py first.")
    exit()

tradereq_id = evaluation.trade_request.pk
print(f"📊 Found evaluation for trade: {evaluation.trade_request.reqname} (ID: {tradereq_id})\n")

# Create authenticated client
client = APIClient()
client.force_authenticate(user=user)

print("1️⃣ Retrieving Evaluation via GET...")
response = client.get(f'/api/ai/evaluation/{tradereq_id}/')

print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ Evaluation Retrieved Successfully!")
    print(f"\n📊 Overall Score: {data['overall_score_out_of_10']}/10")
    print(f"   Quality: {data['quality_label']}")
    print(f"\n📏 Individual Metrics:")
    print(f"   • Task Complexity:  {data['taskcomplexity_out_of_10']}/10")
    print(f"   • Time Commitment:  {data['timecommitment_out_of_10']}/10")
    print(f"   • Skill Level:      {data['skilllevel_out_of_10']}/10")
    print(f"\n💭 What we think:")
    print(f"   {data['evaluationdescription']}")
    print(f"\n✅ Confirmation Status:")
    print(f"   Requester: {data['requester_evaluation_status'] or 'Pending'}")
    print(f"   Responder: {data['responder_evaluation_status'] or 'Pending'}")
else:
    print(f"❌ Error: {response.json()}")

print("\n✅ TE2 test complete!")