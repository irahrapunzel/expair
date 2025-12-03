import json
import os
import re
import logging
from google import genai
from ai.config import GEMINI_PRO

logger = logging.getLogger(__name__)

def evaluate_trade(tradereq_id: int) -> dict:
    """
    Evaluate trade fairness after both parties submit details.
    Returns scores on 0-100 scale (divide by 10 for display).
    
    Returns:
        {
            'taskcomplexity': int (0-100),
            'timecommitment': int (0-100),
            'skilllevel': int (0-100),
            'evaluationdescription': str (max 500 chars)
        }
    """
    from accounts.models import TradeRequest, TradeDetail
    
    # Configure Gemini
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise Exception("GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    
    # Fetch trade and details
    try:
        tradereq = TradeRequest.objects.select_related('requester', 'responder').get(pk=tradereq_id)
    except TradeRequest.DoesNotExist:
        raise Exception(f"TradeRequest {tradereq_id} not found")
    
    # Get trade details for both parties
    details = TradeDetail.objects.filter(trade_request=tradereq).select_related('user')
    
    if details.count() < 2:
        raise Exception(f"Both parties must submit details before evaluation. Found {details.count()}/2 details.")
    
    # Separate requester and responder details
    req_detail = details.filter(user=tradereq.requester).first()
    resp_detail = details.filter(user=tradereq.responder).first()
    
    if not req_detail or not resp_detail:
        raise Exception("Could not find details for both requester and responder")
    
    # Build comparison prompt
    prompt = f"""You are a supportive trade balance advisor. Your role is to help both parties create a fair exchange by providing constructive feedback.

**{tradereq.requester.first_name or tradereq.requester.username}'s Offer:**
- Task: {tradereq.reqname}
- Type: {req_detail.reqtype or 'Not specified'}
- Mode: {req_detail.modedel or 'Not specified'}
- Skill Level: {req_detail.skillprof or 'Not specified'}
- Details: {req_detail.reqbio or 'None'}

**{tradereq.responder.first_name or tradereq.responder.username}'s Offer:**
- Task: {tradereq.exchange or 'Not specified'}
- Type: {resp_detail.reqtype or 'Not specified'}
- Mode: {resp_detail.modedel or 'Not specified'}
- Skill Level: {resp_detail.skillprof or 'Not specified'}
- Details: {resp_detail.reqbio or 'None'}

IMPORTANT: Evaluate based on FAIRNESS and BALANCE between the two offers.

Score THREE metrics (0-100 scale):
1. **Task Complexity Balance**: How well-matched are the complexity levels? 
   - 100 = perfectly matched complexity
   - 0 = very different complexity levels

2. **Time Commitment Balance**: How comparable is the time investment required?
   - 100 = equal time investment
   - 0 = significantly different time needs

3. **Skill Level Balance**: How equivalent are the skill requirements?
   - 100 = equivalent expertise needed
   - 0 = major skill gap

Scoring Framework:
- **90-100**: Excellent balance - Both parties contribute equally valuable work
- **80-89**: Great balance - Very fair with minor differences that add character
- **70-79**: Good balance - Mostly fair, small adjustments would perfect it
- **60-69**: Okay balance - Workable trade, but could be more equitable
- **50-59**: Needs improvement - Noticeable imbalance, adjustments recommended
- **Below 50**: Significant imbalance - Substantial changes needed for fairness

Write your evaluation description (max 500 chars) with these principles:
1. **Be Supportive**: Frame imbalances as opportunities, not criticisms
2. **Be Specific**: Suggest concrete, actionable adjustments (never mention money/payment)
3. **Be Constructive**: Focus on how to improve, not what's wrong
4. **Match Your Scores**: High scores = emphasize fairness; Lower scores = focus on helpful adjustments

Example adjustments (adapt to the actual trades):
- "Add 2 more design concepts" or "Include 3 revision rounds"
- "Expand to include basic setup guide" or "Add follow-up consultation session"
- "Reduce scope from 10 pages to 5 pages" or "Focus on core features instead of full functionality"
- "Include source files and documentation" or "Add maintenance support for 1 month"
- "Combine with another smaller task" or "Split into two separate exchanges"

Your tone should be:
- For 80+: Encouraging and affirming the balance
- For 60-79: Optimistic with helpful refinement suggestions
- For 50-59: Supportive while recommending meaningful adjustments
- Below 50: Constructive, showing a clear path to fairness without being discouraging

Respond ONLY with valid JSON:
{{
    "taskcomplexity": <int 0-100>,
    "timecommitment": <int 0-100>,
    "skilllevel": <int 0-100>,
    "evaluationdescription": "<string max 500 chars - supportive, specific, constructive, matching your scores>"
}}"""

    try:
        logger.info(f"Sending evaluation prompt for trade {tradereq_id} to Gemini...")
        response = client.models.generate_content(
            model=GEMINI_PRO,
            contents=prompt
        )
        
        # Handle potential safety blocking or empty responses
        if not response.text:
            logger.error(f"Gemini returned empty response for trade {tradereq_id}. Safety ratings: {response.prompt_feedback}")
            raise Exception("AI returned empty response (possibly blocked by safety filters)")

        result_text = response.text.strip()
        logger.info(f"Gemini response received. Length: {len(result_text)}")
        
        # Robust JSON extraction using Regex
        # Finds the first occurrence of { ... } including nested braces
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
            result = json.loads(json_str)
        else:
            # Fallback: try parsing the whole text if regex fails
            logger.warning(f"Regex failed to find JSON. Attempting to parse raw text: {result_text[:100]}...")
            result = json.loads(result_text)
        
        # Truncate description to 500 chars
        if 'evaluationdescription' in result:
            result['evaluationdescription'] = result['evaluationdescription'][:500]
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error for trade {tradereq_id}. Response text: {result_text}")
        raise Exception(f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logger.error(f"AI evaluation failed for trade {tradereq_id}: {str(e)}")
        raise Exception(f"AI evaluation failed: {str(e)}")