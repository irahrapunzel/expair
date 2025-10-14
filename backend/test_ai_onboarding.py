import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai.services.onboarding import get_onboarding_best_picks
from accounts.models import User

print("=== Testing Onboarding Best Picks ===\n")

user = User.objects.first()
if user:
    print(f"👤 User: {user.username} (ID: {user.pk})")
    
    try:
        picks = get_onboarding_best_picks(user.pk)
        print(f"\n✅ Found {len(picks)} best picks for onboarding\n")
        
        for i, pick in enumerate(picks, 1):
            print(f"{i}. {pick['trade'].reqname}")
            print(f"   Score: {pick['score']:.3f}")
            print(f"   Requester: {pick['trade'].requester.username}")
            print(f"   Category: {getattr(pick['trade'], 'classified_category', 'N/A')}\n")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⚠️ No users found")