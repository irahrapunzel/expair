import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai.services.matching import rank_explore_trades
from accounts.models import User

print("=== Testing Explore Feed (Multi-Factor Ranking) ===\n")

user = User.objects.first()
if user:
    print(f"👤 User: {user.username} (ID: {user.pk})")
    
    # Show user's interests and skills
    print("\n📋 User Profile:")
    try:
        interests = user.userinterest_set.select_related('genSkills_id').all()
        if interests:
            print(f"   Interests ({len(interests)}):")
            for interest in interests:
                if interest.genSkills_id:
                    print(f"     - {interest.genSkills_id.genCateg}")
        else:
            print("   Interests: None")
    except Exception as e:
        print(f"   Interests: Error - {e}")
    
    try:
        skills = user.userskill_set.select_related('specSkills__genSkills_id').all()
        if skills:
            print(f"   Skills ({len(skills)}):")
            for skill in skills:
                if skill.specSkills:
                    print(f"     - {skill.specSkills.specName} ({skill.specSkills.genSkills_id.genCateg if skill.specSkills.genSkills_id else 'N/A'})")
        else:
            print("   Skills: None")
    except Exception as e:
        print(f"   Skills: Error - {e}")
    
    print("\n" + "="*60)
    print("🔍 Running Multi-Factor Ranking Algorithm...\n")
    
    try:
        trades = rank_explore_trades(for_user_id=user.pk, top_k=10)
        print(f"✅ Found {len(trades)} trades in explore feed\n")
        
        if trades:
            print("📊 Ranked Results:\n")
            for i, result in enumerate(trades, 1):
                trade = result['trade']
                score = result['score']
                breakdown = result['breakdown']
                
                print(f"{i}. {trade.reqname}")
                print(f"   Overall Score: {score:.3f}")
                print(f"   Requester: {trade.requester.username}")
                print(f"   Category: {getattr(trade, 'classified_category', 'N/A')}")
                print(f"   Exchange: {getattr(trade, 'exchange', 'N/A')}")
                print(f"\n   Score Breakdown:")
                print(f"     • AI Similarity:  {breakdown['semantic']:.3f} (40% weight) - Semantic understanding")
                print(f"     • Category Match: {breakdown['category']:.3f} (25% weight) - Interest alignment")
                print(f"     • Skills Match:   {breakdown['skills']:.3f} (20% weight) - Skill compatibility")
                print(f"     • Location:       {breakdown['location']:.3f} (10% weight) - Geographic proximity")
                print(f"     • Availability:   {breakdown['recency']:.3f} (5% weight) - Deadline urgency")
                print()
        else:
            print("   ℹ️  No trades available for matching")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⚠️ No users found")