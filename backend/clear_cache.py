import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ai.cache import clear_cache, cache_stats

print("🧹 Clearing AI embedding cache...")
clear_cache()
cache_stats()
print("✅ Cache cleared!")