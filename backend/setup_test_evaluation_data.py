import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User, TradeRequest, TradeDetail
from datetime import date

print("=== Setting Up Test Data for TE1 ===\n")

# Get two users
users = User.objects.all()[:2]
if users.count() < 2:
    print("❌ Need at least 2 users in database")
    exit()

user1 = users[0]
user2 = users[1]

print(f"👤 User 1 (Requester): {user1.username} (ID: {user1.pk})")
print(f"👤 User 2 (Responder): {user2.username} (ID: {user2.pk})\n")

# Find or create a trade request
trade = TradeRequest.objects.filter(
    requester=user1,
    responder=user2
).first()

if not trade:
    print("📝 Creating new trade request...")
    trade = TradeRequest.objects.create(
        requester=user1,
        responder=user2,
        reqname="Website Development",
        exchange="Logo Design",
        reqdeadline=date(2025, 12, 31),
    )
    print(f"✅ Created trade: {trade.reqname} ↔️ {trade.exchange} (ID: {trade.pk})")
else:
    print(f"✅ Using existing trade: {trade.reqname} ↔️ {trade.exchange} (ID: {trade.pk})")

# Create trade details for requester (user1)
detail1, created1 = TradeDetail.objects.get_or_create(
    trade_request=trade,
    user=user1,
    defaults={
        'reqtype': 'Service',
        'modedel': 'Online',
        'skillprof': 'Expert',
        'reqbio': 'Full-stack web development with React and Django. Includes responsive design, database setup, and deployment. Estimated 2-3 weeks of work.',
    }
)

if created1:
    print(f"✅ Created details for requester ({user1.username})")
else:
    print(f"✅ Updated details for requester ({user1.username})")

# Create trade details for responder (user2)
detail2, created2 = TradeDetail.objects.get_or_create(
    trade_request=trade,
    user=user2,
    defaults={
        'reqtype': 'Service',
        'modedel': 'Online',
        'skillprof': 'Intermediate',
        'reqbio': 'Professional logo design with 3 revision rounds. Includes source files and brand guidelines. Estimated 1 week of work.',
    }
)

if created2:
    print(f"✅ Created details for responder ({user2.username})")
else:
    print(f"✅ Updated details for responder ({user2.username})")

# Verify
details_count = TradeDetail.objects.filter(trade_request=trade).count()
print(f"\n📊 Trade {trade.pk} now has {details_count}/2 details")

if details_count == 2:
    print("✅ Ready for evaluation testing!")
    print(f"\n🚀 Run this command to test:")
    print(f"   python test_te1_evaluation.py")
    print(f"\n📝 Trade ID for testing: {trade.pk}")
else:
    print("❌ Something went wrong. Check the database.")

print("\n✅ Setup complete!")