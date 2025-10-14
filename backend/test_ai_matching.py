import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db.models import Count
from ai.services.matching import rank_best_picks, rank_explore_trades, get_best_match
from accounts.models import User, TradeRequest

print("=== Testing AI Matching ===\n")

# First, check database status
print("📊 Database Status Check:")
all_trades = TradeRequest.objects.all()
print(f"   Total trades: {all_trades.count()}")

status_counts = TradeRequest.objects.values('status').annotate(count=Count('status'))
print(f"\n   Trades by status:")
for item in status_counts:
    print(f"     - {item['status']}: {item['count']}")

# Get test user
user = User.objects.first()
if not user:
    print("\n⚠️ No users found in database")
    exit()

user_id = user.pk
print(f"\n👤 Testing for user: {user.username} (ID: {user_id})")

# Check what's available for this user
user_trades = TradeRequest.objects.filter(requester=user)
print(f"   User's own trades: {user_trades.count()}")

available = TradeRequest.objects.filter(status__iexact='pending').exclude(requester=user)
print(f"   Available pending trades: {available.count()}")

if available.exists():
    print(f"\n   Available trades to match (sample):")
    for trade in available[:5]:
        print(f"     - {trade.reqname} (by {trade.requester.username})")

print("\n" + "="*60)
print("🔍 Running Simple Onboarding Matching (rank_best_picks)...\n")

try:
    matches = rank_best_picks(for_user_id=user_id, top_k=5)
    print(f"✅ SUCCESS! Found {len(matches)} simple matches\n")
    
    if matches:
        print("   Top Matches (simple):")
        for i, match in enumerate(matches[:5], 1):
            trade = match.get('trade') if isinstance(match, dict) else None
            score = match.get('score', 0) if isinstance(match, dict) else 0
            if trade:
                print(f"\n   {i}. {trade.reqname}")
                print(f"      Score: {score:.3f}")
                print(f"      Requester: {trade.requester.username}")
                print(f"      Status: {getattr(trade, 'status', None)}")
            else:
                print(f"   {i}. Unexpected format: {match}")
    else:
        print("   ℹ️  No simple matches found")
        
except Exception as e:
    print(f"❌ ERROR (simple matching): {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("🔍 Running Explore Ranking (rank_explore_trades) with breakdown...\n")

try:
    explore_matches = rank_explore_trades(for_user_id=user_id, top_k=10)
    print(f"✅ SUCCESS! Found {len(explore_matches)} explore matches\n")
    
    if explore_matches:
        print("   Top Explore Matches:")
        for i, item in enumerate(explore_matches[:10], 1):
            trade = item['trade']
            score = item['score']
            breakdown = item.get('breakdown', {})
            print(f"\n   {i}. {trade.reqname}")
            print(f"      Overall Score: {score:.3f}")
            print(f"      Requester: {trade.requester.username}")
            print(f"      Category: {getattr(trade, 'classified_category', 'N/A')}")
            print(f"      Exchange: {getattr(trade, 'exchange', 'N/A')}")
            print("      Breakdown:")
            print(f"         - Semantic: {breakdown.get('semantic', 0):.3f}")
            print(f"         - Category: {breakdown.get('category', 0):.3f}")
            print(f"         - Skills:   {breakdown.get('skills', 0):.3f}")
            print(f"         - Location: {breakdown.get('location', 0):.3f}")
            print(f"         - Recency:  {breakdown.get('recency', 0):.3f}")
    else:
        print("   ℹ️  No explore matches found")
        
except Exception as e:
    print(f"❌ ERROR (explore ranking): {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("🔎 Fetching THE Best Match (get_best_match)...\n")

try:
    best = get_best_match(for_user_id=user_id)
    if best:
        trade = best['trade']
        print("✅ Best match found:")
        print(f"   Trade: {trade.reqname} (ID: {trade.pk})")
        print(f"   Requester: {trade.requester.username}")
        print(f"   Score: {best['score']:.3f}")
        print("   Breakdown:")
        for k, v in best.get('breakdown', {}).items():
            print(f"      - {k}: {v:.3f}")
    else:
        print("   ℹ️ No best match found")
except Exception as e:
    print(f"❌ ERROR (best match): {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test complete. Run `python test_ai_matching.py` to execute.")