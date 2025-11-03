"""
Quick test to verify environment configuration after cleanup
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / '.env')

print("=" * 50)
print("ENVIRONMENT CONFIGURATION TEST")
print("=" * 50)

# Check API Keys
gemini_key = os.getenv('GEMINI_API_KEY')
print(f"\n✅ GEMINI_API_KEY: {'Set' if gemini_key else '❌ MISSING'}")
print(f"   Length: {len(gemini_key) if gemini_key else 0} chars")

# Check Models
model_pro = os.getenv('GEMINI_MODEL_PRO')
model_fast = os.getenv('GEMINI_MODEL_FAST')
model_embed = os.getenv('GEMINI_EMBED_MODEL')

print(f"\n✅ GEMINI_MODEL_PRO: {model_pro or '❌ MISSING'}")
print(f"✅ GEMINI_MODEL_FAST: {model_fast or '❌ MISSING'}")
print(f"✅ GEMINI_EMBED_MODEL: {model_embed or '❌ MISSING'}")

# Check for removed keys
removed_keys = ['GOOGLE_API_KEY', 'HUGGINGFACE_API_KEY', 'GEMINI_MODEL_REASON']
print("\n" + "=" * 50)
print("CHECKING FOR REMOVED KEYS (should all be None)")
print("=" * 50)
for key in removed_keys:
    value = os.getenv(key)
    if value:
        print(f"❌ {key}: Still present! Should be removed.")
    else:
        print(f"✅ {key}: Correctly removed")

print("\n" + "=" * 50)
print("EXPECTED CONFIGURATION:")
print("=" * 50)
print("GEMINI_API_KEY: AIzaSyC... (39+ chars)")
print("GEMINI_MODEL_PRO: gemini-2.5-pro")
print("GEMINI_MODEL_FAST: gemini-2.5-flash")
print("GEMINI_EMBED_MODEL: gemini-embedding-001")
print("=" * 50)