"""
Trade request classifier service
Categorizes trades into predefined categories using AI
"""

from ai.config import GEMINI_FLASH, CATEGORIES
from ai.services.clients import gemini_client
from ai.model_access import get_model


def categorize_tradereq(tradereq_id: int) -> str:
    """
    Classify a trade request into one of the predefined categories.
    Saves the category to the database.
    
    Args:
        tradereq_id: ID of the trade request to categorize
        
    Returns:
        Category name (str)
    """
    if gemini_client is None:
        raise RuntimeError("Gemini AI client not initialized. Check GEMINI_API_KEY.")
    
    TradeRequest = get_model("TradeRequest")
    
    try:
        trade = TradeRequest.objects.get(pk=tradereq_id)
    except TradeRequest.DoesNotExist:
        raise ValueError(f"TradeRequest with id {tradereq_id} not found")
    
    # Build prompt for categorization
    prompt = f"""
You are a trade categorization assistant. Categorize the following trade request into ONE of these categories:

Categories:
{', '.join(CATEGORIES)}

Trade Request:
- Name: {trade.reqname}
- Exchange Offer: {getattr(trade, 'exchange', 'Not specified')}

Instructions:
1. Choose the MOST appropriate category from the list above
2. Respond with ONLY the category name, nothing else
3. If uncertain, choose "Other"

Category:"""
    
    # Call Gemini API using the new google-genai SDK
    response = gemini_client.models.generate_content(
        model=GEMINI_FLASH,
        contents=prompt
    )
    
    category = response.text.strip()
    
    # Validate category
    if category not in CATEGORIES:
        # Try to find closest match
        category_lower = category.lower()
        for valid_cat in CATEGORIES:
            if valid_cat.lower() in category_lower or category_lower in valid_cat.lower():
                category = valid_cat
                break
        else:
            category = "Other"  # Default if no match found
    
    # Save category to database
    trade.classified_category = category
    trade.save(update_fields=['classified_category'])
    
    return category