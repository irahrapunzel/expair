from datetime import date, timedelta
from django.db.models import Q
from django.apps import apps

from ai.services.embedding import get_user_vec, get_trade_vec, _cos
from ai.services.text_utils import _user_text, _trade_text, get_first_attr
from ai.services.clients import gemini_client
from ai.config import (
    TR_PK_FIELDS,
    TR_REQUESTER_FK_FIELDS,
    TR_REQDEADLINE_FIELDS,
    USER_LOCATION_FIELDS,
    GEMINI_FLASH
)
from ai.model_access import get_model


def calculate_location_proximity(user_location: str, trade_location: str) -> float:
    """
    Use Gemini AI to calculate location proximity score.
    Handles varying formats: addresses, cities, provinces, coordinates, etc.
    
    Args:
        user_location: User's location (any format)
        trade_location: Trade requester's location (any format)
        
    Returns:
        Score between 0.0 and 1.0
    """
    if not user_location or not trade_location:
        return 0.5  # Neutral if no location data
    
    if not gemini_client:
        # Fallback to simple string matching
        user_loc_lower = str(user_location).lower()
        trade_loc_lower = str(trade_location).lower()
        
        if user_loc_lower == trade_loc_lower:
            return 1.0
        elif user_loc_lower in trade_loc_lower or trade_loc_lower in user_loc_lower:
            return 0.7
        return 0.3
    
    prompt = f"""
Analyze the proximity between these two locations and return a proximity score.

Location 1: {user_location}
Location 2: {trade_location}

Consider:
- Same exact location = 1.0
- Same city/municipality = 0.9
- Same province/state = 0.7
- Same region = 0.5
- Same country = 0.3
- Different country = 0.1

Respond with ONLY a number between 0.0 and 1.0, nothing else.
"""
    
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_FLASH,
            contents=prompt
        )
        
        score_text = response.text.strip()
        score = float(score_text)
        
        # Ensure score is between 0 and 1
        score = max(0.0, min(1.0, score))
        return score
        
    except Exception as e:
        print(f"⚠️ Location scoring error: {e}, using fallback")
        # Fallback to simple matching
        user_loc_lower = str(user_location).lower()
        trade_loc_lower = str(trade_location).lower()
        
        if user_loc_lower == trade_loc_lower:
            return 1.0
        elif user_loc_lower in trade_loc_lower or trade_loc_lower in user_loc_lower:
            return 0.7
        return 0.3


def get_best_match(for_user_id: int) -> dict:
    """
    Get THE single best match for a user.
    Returns the most compatible trade based on multi-factor scoring.
    
    Args:
        for_user_id: User ID to find best match for
        
    Returns:
        dict with 'trade' and 'score' keys, or None if no matches
    """
    # Use the explore ranking to get all ranked trades
    ranked_trades = rank_explore_trades(for_user_id=for_user_id, top_k=1)
    
    if ranked_trades:
        return ranked_trades[0]  # Return the #1 best match
    
    return None


def rank_best_picks(for_user_id: int, top_k: int = 6) -> list:
    """
    Rank trade requests for onboarding.
    Uses the SAME multi-factor algorithm as explore feed.
    Returns top 6 matches by default.
    
    Args:
        for_user_id: User going through onboarding
        top_k: Number of picks to return (default 6 for onboarding)
        
    Returns:
        List of dicts with 'trade' and 'score' keys
    """
    # Just use the same explore ranking algorithm
    return rank_explore_trades(for_user_id=for_user_id, top_k=top_k)


def rank_explore_trades(for_user_id: int, top_k: int = 20) -> list:
    """
    Rank ALL trades for explore page with multi-factor scoring:
    - AI semantic similarity (40%) - understands context
    - Interest/Category match (25%) - user's interests vs trade category
    - Skills match (20%) - user's skills vs what trade needs
    - Location proximity (10%) - AI-powered location analysis
    - Availability/Recency (5%) - deadline consideration
    
    This is the MAIN ranking algorithm used throughout the app.
    Everything is ranked from most compatible to least compatible.
    
    Args:
        for_user_id: User viewing explore page
        top_k: Number of results to return
        
    Returns:
        List of trades ranked by combined weighted score (highest first)
    """
    TradeRequest = get_model("TradeRequest")
    User = get_model("User")
    UserInterest = get_model("UserInterest")
    UserSkill = get_model("UserSkill")
    GenSkill = get_model("GenSkill")
    
    try:
        user = User.objects.get(pk=for_user_id)
    except User.DoesNotExist:
        return []
    
    # Get user's interests (general categories they're interested in)
    user_interest_categories = set()
    try:
        interests = UserInterest.objects.filter(user=user).select_related('genSkills_id')
        user_interest_categories = {
            interest.genSkills_id.genCateg 
            for interest in interests 
            if interest.genSkills_id
        }
    except Exception as e:
        print(f"⚠️ Error fetching user interests: {e}")
    
    # Get user's skills (specialized skills they can offer)
    user_skill_names = set()
    user_skill_categories = set()
    try:
        skills = UserSkill.objects.filter(user=user).select_related('specSkills__genSkills_id')
        for skill in skills:
            if skill.specSkills:
                user_skill_names.add(skill.specSkills.specName)
                if skill.specSkills.genSkills_id:
                    user_skill_categories.add(skill.specSkills.genSkills_id.genCateg)
    except Exception as e:
        print(f"⚠️ Error fetching user skills: {e}")
    
    # Get user embedding for semantic matching
    user_vec = get_user_vec(user.pk, lambda uid: _user_text(User.objects.get(pk=uid)))
    
    # Get user's location for proximity analysis
    user_location = getattr(user, 'location', None)
    
    # Get all available trades (excluding user's own)
    available_trades = TradeRequest.objects.filter(
        Q(status='PENDING') | Q(status__isnull=True)
    ).exclude(
        requester=user
    ).exclude(
        status__in=['COMPLETED', 'CANCELLED']
    ).select_related('requester')
    
    results = []
    today = date.today()
    
    for trade in available_trades:
        # Factor 1: AI Semantic Similarity (40%)
        trade_vec = get_trade_vec(trade.pk, lambda tid: _trade_text(TradeRequest.objects.get(pk=tid)))
        semantic_score = float(_cos(user_vec, trade_vec)) if trade_vec is not None else 0.0
        
        # Factor 2: Interest/Category Match (25%)
        category_score = 0.0
        if trade.classified_category:
            # Check if trade category matches user's interests
            if trade.classified_category in user_interest_categories:
                category_score = 1.0  # Perfect match - user is interested in this category
            # Check if trade category matches categories user has skills in
            elif trade.classified_category in user_skill_categories:
                category_score = 0.7  # Good match - user has skills in this category
            # Partial credit if user has some interests
            elif user_interest_categories:
                category_score = 0.2
        
        # Factor 3: Skills Match (20%)
        skills_score = 0.0
        
        if trade.exchange:
            exchange_lower = trade.exchange.lower()
            reqname_lower = trade.reqname.lower()
            
            # Check if user's skill categories are mentioned
            for skill_cat in user_skill_categories:
                if skill_cat.lower() in exchange_lower or skill_cat.lower() in reqname_lower:
                    skills_score = max(skills_score, 0.8)
                    break
            
            # Check if user's specific skills are mentioned
            for skill_name in user_skill_names:
                if skill_name.lower() in exchange_lower or skill_name.lower() in reqname_lower:
                    skills_score = 1.0
                    break
            
            # If no direct match but user has skills, give small credit
            if skills_score == 0.0 and (user_skill_names or user_skill_categories):
                skills_score = 0.3
        
        # Factor 4: Location Proximity (10%) - AI-Powered
        location_score = 0.5  # Default neutral
        requester_location = getattr(trade.requester, 'location', None)
        
        if user_location and requester_location:
            # Use Gemini AI to analyze location proximity
            location_score = calculate_location_proximity(user_location, requester_location)
        
        # Factor 5: Availability/Recency (5%)
        recency_score = 0.5
        if trade.reqdeadline:
            try:
                days_until_deadline = (trade.reqdeadline - today).days
                if 7 <= days_until_deadline <= 30:
                    recency_score = 1.0  # Sweet spot
                elif days_until_deadline < 7:
                    recency_score = 0.7  # Urgent
                elif days_until_deadline > 30:
                    recency_score = 0.4  # Far future
                else:
                    recency_score = 0.1  # Past deadline
            except:
                pass
        
        # Combined weighted score
        combined_score = (
            semantic_score * 0.40 +
            category_score * 0.25 +
            skills_score * 0.20 +
            location_score * 0.10 +
            recency_score * 0.05
        )
        
        results.append({
            'trade': trade,
            'score': float(combined_score),
            'breakdown': {
                'semantic': semantic_score,
                'category': category_score,
                'skills': skills_score,
                'location': location_score,
                'recency': recency_score
            }
        })
    
    # Sort by combined score descending (most compatible first)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Return top K
    return results[:top_k]