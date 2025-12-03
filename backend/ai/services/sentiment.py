import json
import os
import re
import logging
from google import genai
from ai.config import GEMINI_FLASH

logger = logging.getLogger(__name__)

def analyze_sentiment(review_text: str) -> dict:
    """
    Analyze sentiment of a trade review and generate star rating (1-5).
    Uses aggressive/sensitive scoring - any negative mention significantly impacts rating.
    
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
    
    # Build AGGRESSIVE sentiment analysis prompt
    prompt = f"""You are a STRICT and CRITICAL review analyzer. Your job is to catch ANY negative signals and penalize accordingly.

Analyze this trade review and assign a star rating (1-5 stars).

Review text:
"{review_text}"

⚠️ CRITICAL SCORING RULES - BE STRICT:

**5 stars** (PERFECT - Reserve for truly flawless experiences):
- ONLY if review is 100% positive with NO issues mentioned
- Words like: "perfect", "excellent", "amazing", "flawless", "exceeded expectations", "couldn't be happier"
- NO mentions of: delays, mistakes, issues, problems, waiting, late, slow, confusion, miscommunication
- If there's even ONE minor complaint, DO NOT give 5 stars

**4 stars** (GOOD - Minor imperfections):
- Mostly positive but with VERY minor issues that were quickly resolved
- Small delays (less than a day) that didn't really matter
- Tiny miscommunications that were immediately clarified
- Deduct to 4 stars if: "but", "however", "although", "except", "only issue", "small problem"

**3 stars** (AVERAGE - Notable issues):
- Mixed experience with clear problems
- Delays of 1-3 days
- Quality issues that required revision
- Communication gaps
- Words like: "okay", "acceptable", "could be better", "had to wait", "took a while", "some issues"
- ANY mention of mistakes, errors, or needing to redo work = 3 stars MAX

**2 stars** (POOR - Significant problems):
- Major delays (3+ days)
- Quality significantly below expectations
- Multiple issues or revisions needed
- Poor communication requiring follow-ups
- Words like: "disappointed", "frustrated", "not what I expected", "had to ask multiple times"

**1 star** (TERRIBLE - Failed trade):
- Trade essentially failed or was extremely unsatisfactory
- Very late delivery or incomplete work
- Major quality failures
- Unprofessional behavior
- Words like: "terrible", "awful", "worst", "never again", "waste of time", "unacceptable"

🔍 NEGATIVE KEYWORD DETECTION (automatic deductions):
- "delay", "delayed", "late", "slow", "waiting", "took longer" → MAX 4 stars
- "mistake", "error", "wrong", "incorrect", "had to fix" → MAX 3 stars
- "miscommunication", "confusion", "unclear" → MAX 4 stars
- "revision", "redo", "again", "fix" → MAX 3 stars
- "disappointed", "frustrated", "annoyed" → MAX 2 stars
- "but", "however", "although" followed by complaint → Deduct 1 star

📊 SENTIMENT CLASSIFICATION:
- "positive": 4-5 stars (genuinely good experience)
- "neutral": 3 stars (mixed/average)
- "negative": 1-2 stars (bad experience)

Respond ONLY with valid JSON:
{{
    "stars": <int 1-5>,
    "sentiment": "<positive, neutral, or negative>",
    "confidence": <float 0.0-1.0>,
    "detected_issues": ["<list any negative keywords or issues found>"]
}}"""

    try:
        logger.info(f"Analyzing sentiment for review: {review_text[:50]}...")
        response = client.models.generate_content(
            model=GEMINI_FLASH,
            contents=prompt
        )
        result_text = response.text.strip()
        logger.info(f"Sentiment analysis response: {result_text[:100]}...")
        
        # Robust JSON extraction using regex
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
            result = json.loads(json_str)
        else:
            # Fallback: try parsing the whole text
            result = json.loads(result_text)
        
        # Validate stars are in range
        if not (1 <= result['stars'] <= 5):
            logger.warning(f"Stars out of range: {result['stars']}, clamping to 1-5")
            result['stars'] = max(1, min(5, result['stars']))
        
        # Log detected issues for debugging
        if 'detected_issues' in result and result['detected_issues']:
            logger.info(f"Detected issues: {result['detected_issues']}")
        
        # Return only the required fields
        return {
            'stars': result['stars'],
            'sentiment': result.get('sentiment', 'neutral'),
            'confidence': result.get('confidence', 0.8)
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error in sentiment analysis. Response: {result_text}")
        # Fallback: analyze manually with keyword detection
        return _fallback_sentiment_analysis(review_text)
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {str(e)}")
        return _fallback_sentiment_analysis(review_text)


def _fallback_sentiment_analysis(review_text: str) -> dict:
    """
    Fallback sentiment analysis using keyword detection.
    Used when AI fails. Also applies strict/aggressive scoring.
    """
    text_lower = review_text.lower()
    
    # Start with 5 stars and deduct
    stars = 5
    detected_issues = []
    
    # Severe negative keywords (immediate 1-2 stars)
    severe_negative = ['terrible', 'awful', 'worst', 'horrible', 'unacceptable', 'waste of time', 'never again', 'scam']
    for word in severe_negative:
        if word in text_lower:
            detected_issues.append(word)
            stars = min(stars, 1)
    
    # Strong negative keywords (max 2 stars)
    strong_negative = ['disappointed', 'frustrated', 'angry', 'annoyed', 'upset', 'not what i expected', 'poor quality']
    for word in strong_negative:
        if word in text_lower:
            detected_issues.append(word)
            stars = min(stars, 2)
    
    # Moderate negative keywords (max 3 stars)
    moderate_negative = ['mistake', 'error', 'wrong', 'incorrect', 'fix', 'revision', 'redo', 'problem', 'issue']
    for word in moderate_negative:
        if word in text_lower:
            detected_issues.append(word)
            stars = min(stars, 3)
    
    # Minor negative keywords (max 4 stars)
    minor_negative = ['delay', 'delayed', 'late', 'slow', 'waiting', 'took longer', 'but', 'however', 'although', 'except', 'unfortunately']
    for word in minor_negative:
        if word in text_lower:
            detected_issues.append(word)
            stars = min(stars, 4)
    
    # Determine sentiment
    if stars >= 4:
        sentiment = 'positive'
    elif stars == 3:
        sentiment = 'neutral'
    else:
        sentiment = 'negative'
    
    logger.info(f"Fallback sentiment: {stars} stars, issues: {detected_issues}")
    
    return {
        'stars': stars,
        'sentiment': sentiment,
        'confidence': 0.7  # Lower confidence for fallback
    }