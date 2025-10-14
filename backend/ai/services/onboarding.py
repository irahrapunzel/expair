"""
Onboarding service for new users
Handles initial best picks during signup flow
"""

from ai.services.matching import rank_best_picks
from ai.model_access import get_model


def get_onboarding_best_picks(user_id: int) -> list:
    """
    Get top 6 best picks for new user during onboarding.
    
    Args:
        user_id: ID of the user going through onboarding
        
    Returns:
        List of exactly 6 trade matches with scores (or fewer if not enough trades)
    """
    # Get top 6 matches using existing matching algorithm
    matches = rank_best_picks(for_user_id=user_id, top_k=6)
    
    return matches[:6]


def create_interests_from_onboarding(user_id: int, tradereq_ids: list):
    """
    When user clicks "I'm interested" during onboarding,
    add selected trades to their "Trades you're interested in"
    
    Args:
        user_id: User who is interested
        tradereq_ids: List of trade request IDs they selected from best picks
        
    Returns:
        Number of interests created
    """
    User = get_model('User')
    TradeRequest = get_model('TradeRequest')
    TradeInterest = get_model('TradeInterest')
    
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return 0
    
    created_count = 0
    
    for tradereq_id in tradereq_ids:
        try:
            trade = TradeRequest.objects.get(pk=tradereq_id)
            
            # Create trade interest record (avoid duplicates)
            interest, created = TradeInterest.objects.get_or_create(
                trade_request=trade,
                interested_user=user,
                defaults={'status': 'PENDING'}
            )
            
            if created:
                created_count += 1
                
        except TradeRequest.DoesNotExist:
            continue
    
    return created_count


def skip_onboarding_picks(user_id: int):
    """
    User skipped selecting best picks during onboarding.
    Just log this event (optional analytics).
    
    Args:
        user_id: User who skipped
    """
    # You can add analytics/logging here if needed
    print(f"User {user_id} skipped onboarding picks")
    pass