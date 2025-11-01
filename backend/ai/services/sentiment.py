import json
import os
from google import genai
from ai.config import GEMINI_PRO

def analyze_sentiment(review_text: str) -> dict:
    """
    Analyze sentiment of a trade review and generate star rating (1-5).
    
    Args:
        review_text: The user's written review of how the trade went
        
    Returns:
        {
            'stars': int (1-5),
            'sentiment': str ('positive', 'neutral', 'negative'),
            'confidence': float (0.0-1.0)
        }
    """
    # Configure Gemini
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise Exception("GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    
    # Build sentiment analysis prompt
    prompt = f"""Analyze the sentiment of this trade review and assign a star rating (1-5 stars).

Review text:
"{review_text}"

Consider:
- **5 stars**: Extremely positive, exceeded expectations, highly satisfied
- **4 stars**: Positive experience, met expectations, satisfied
- **3 stars**: Neutral/mixed, acceptable but with some issues
- **2 stars**: Negative experience, below expectations, dissatisfied
- **1 star**: Very negative, major problems, very dissatisfied

Respond ONLY with valid JSON:
{{
    "stars": <int 1-5>,
    "sentiment": "<positive, neutral, or negative>",
    "confidence": <float 0.0-1.0>
}}"""

    try:
        response = client.models.generate_content(
            model=GEMINI_PRO,
            contents=prompt
        )
        result_text = response.text.strip()
        
        # Parse JSON
        if result_text.startswith("```json"):
            result_text = result_text.replace("```json", "").replace("```", "").strip()
        
        result = json.loads(result_text)
        
        # Validate stars are in range
        if not (1 <= result['stars'] <= 5):
            raise ValueError(f"Stars must be 1-5, got {result['stars']}")
        
        return result
        
    except Exception as e:
        raise Exception(f"Sentiment analysis failed: {str(e)}")