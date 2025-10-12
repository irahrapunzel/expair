"""
Initialize Gemini AI client
"""

import os
from google import genai
from google.genai import types

# Get API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Initialize Gemini client
gemini_client = None

if GEMINI_API_KEY:
    try:
        # Configure with the new google-genai SDK
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Show which key was used
        if os.getenv("GEMINI_API_KEY") and os.getenv("GOOGLE_API_KEY"):
            print("Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY.")
        
        print(f"✅ Gemini AI client initialized successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini client: {e}")
        gemini_client = None
else:
    print("⚠️ GEMINI_API_KEY not found in environment variables")

# Sentiment pipeline removed - only use Gemini for sentiment analysis when needed
sentiment_pipeline = None