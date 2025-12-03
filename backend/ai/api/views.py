from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai.services.matching import rank_best_picks, rank_explore_trades, get_best_match
from ai.services.classifier import categorize_tradereq
from ai.services.evaluation import evaluate_trade
from ai.services.onboarding import get_onboarding_best_picks, create_interests_from_onboarding
from ai.services.clients import gemini_client
from ai.api.serializers import BestPicksIn, CategorizeIn, EvaluateIn
from accounts.models import Evaluation
from ai.services.sentiment import analyze_sentiment
from ai.api.serializers import SubmitRatingIn
from accounts.models import ReputationSystem, TradeRequest
from django.utils import timezone
from django.db.models import Avg
from django.core.cache import cache

from ..services.onboarding import OnboardingService
from django.db.models import Q
from accounts.models import UserInterest, UserSkill

import logging
logger = logging.getLogger(__name__)

def check_ai_available():
    """Check if AI features are available"""
    if gemini_client is None:
        return False, Response(
            {"error": "AI features are currently unavailable. GEMINI_API_KEY not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    return True, None


def get_basic_explore_feed(request):
    """Basic explore feed without AI - returns recent trade requests"""
    from accounts.models import TradeRequest
    
    user_id = request.user.pk
    limit = int(request.GET.get('limit', 50))
    
    # Get recent trade requests excluding user's own
    trades = TradeRequest.objects.filter(
        status__in=["PENDING", None]
    ).exclude(
        requester_id=user_id
    ).select_related('requester').order_by('-created_at')[:limit]
    
    # Format response similar to AI version
    results = []
    for trade in trades:
        results.append({
            "tradereq_id": trade.pk,
            "reqname": trade.reqname,
            "requester": trade.requester.username,
            "requester_id": trade.requester.pk,
            "reqdeadline": getattr(trade, 'reqdeadline', None),
            "exchange": getattr(trade, 'exchange', None),
            "created_at": trade.created_at.isoformat() if trade.created_at else None,
            "category": getattr(trade, 'classified_category', None),
            "score": 0.5,  # Default score for basic feed
            "score_breakdown": {
                "ai_similarity": 0.0,
                "interest_match": 0.0,
                "skills_match": 0.0,
                "location_proximity": 0.0,
                "availability": 0.5
            }
        })
    
    return Response({
        "trades": results,
        "total": len(results),
        "ai_enabled": False
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_best_picks(request):
    """Get best matching trades for a user"""
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = BestPicksIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data.get("user_id", request.user.pk)
    top_k = serializer.validated_data.get("top_k", 20)

    try:
        matches = rank_best_picks(for_user_id=user_id, top_k=top_k)
        return Response({
            "matches": [
                {
                    "tradereq_id": m['trade'].pk,
                    "reqname": m['trade'].reqname,
                    "requester": m['trade'].requester.username,
                    "score": m['score'],
                    "category": getattr(m['trade'], 'classified_category', None),
                }
                for m in matches
            ]
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_onboarding_picks(request):
    """
    Get 6 best picks for user onboarding (generic fallback).
    Finds user's latest trade request and returns compatible matches.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    
    # Caching
    cache_key = f"onboarding_picks_{user_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        logger.info(f"Returning cached onboarding picks for user {user_id}")
        return Response(cached_data)

    try:
        # Get the user's latest trade request
        latest_request = TradeRequest.objects.filter(
            requester_id=user_id
        ).order_by('-created_at').first()

        if not latest_request:
            return Response({
                "best_picks": [],
                "count": 0,
                "message": "Please create your first trade request to see matches."
            })

        picks = get_onboarding_best_picks(user_id, limit=6)
        
        if not picks:
            response_data = {
                "best_picks": [],
                "count": 0,
                "request_text": latest_request.reqname or "",
                "message": "No matches found yet. Try completing your profile or check back later!"
            }
            cache.set(cache_key, response_data, 300)
            return Response(response_data)

        response_data = {
            "best_picks": picks,
            "count": len(picks),
            "request_text": latest_request.reqname or ""
        }
        cache.set(cache_key, response_data, 300)
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in api_onboarding_picks: {e}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def onboarding_picks_for_request(request):
    """
    Get personalized best picks based on a specific trade request ID.
    This is the preferred endpoint when tradereq_id is available.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    tradereq_id = request.GET.get('tradereq_id')
    
    if not tradereq_id:
        return Response(
            {'error': 'tradereq_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        tradereq_id = int(tradereq_id)
    except ValueError:
        return Response(
            {'error': 'tradereq_id must be an integer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify the trade request exists and belongs to the user
    try:
        trade_request = TradeRequest.objects.get(
            tradereq_id=tradereq_id,
            requester_id=request.user.id
        )
    except TradeRequest.DoesNotExist:
        return Response(
            {'error': 'Trade request not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Caching
    cache_key = f"onboarding_picks_req_{tradereq_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        logger.info(f"Returning cached picks for tradereq {tradereq_id}")
        return Response(cached_data)
    
    try:
        # Generate personalized picks
        service = OnboardingService()
        best_picks = service.get_best_picks_for_request(
            tradereq_id=tradereq_id,
            requester_id=request.user.id,
            limit=6
        )
        
        if not best_picks:
            response_data = {
                'best_picks': [],
                'count': 0,
                'request_text': trade_request.reqname or "",
                'message': 'No matches found yet. Try completing your profile or check back later!'
            }
            cache.set(cache_key, response_data, 300)
            return Response(response_data)
        
        response_data = {
            'best_picks': best_picks,
            'count': len(best_picks),
            'request_text': trade_request.reqname or ""
        }
        
        cache.set(cache_key, response_data, 300)
        logger.info(f"Returning {len(best_picks)} picks for tradereq {tradereq_id}")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in onboarding_picks_for_request: {e}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_mark_interested(request):
    """
    Mark trades as interested during onboarding or explore.
    Adds to user's "Trades you're interested in" section.
    """
    tradereq_ids = request.data.get('tradereq_ids', [])
    
    if not tradereq_ids:
        return Response(
            {"error": "tradereq_ids is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        created_count = create_interests_from_onboarding(
            user_id=request.user.pk,
            tradereq_ids=tradereq_ids
        )
        return Response({
            "success": True,
            "created_count": created_count,
            "message": f"Added {created_count} trades to your interests"
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_feed(request):
    """
    AI-powered explore feed with multi-factor ranking:
    - AI semantic similarity (40%) - understands context
    - Interest/Category match (25%) - user's interests vs trade category
    - Skills match (20%) - user's skills vs what trade needs
    - Location proximity (10%) - AI-powered location analysis
    - Availability/Recency (5%) - deadline consideration
    
    Returns personalized trade recommendations.
    """
    # Fallback to basic feed if AI is not available
    available, error_response = check_ai_available()
    if not available:
        logger.warning("AI not available, returning basic explore feed")
        return get_basic_explore_feed(request)
    
    user_id = request.user.pk
    limit = int(request.GET.get('limit', 200))
    
    # Cache key
    cache_key = f"explore_feed_{user_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        logger.info(f"Returning cached explore feed for user {user_id}")
        return Response(cached_data)
    
    try:
        logger.info(f"🔍 Starting explore feed for user {user_id}")
        
        # ✅ Call rank_explore_trades with correct parameters
        ranked_trades = rank_explore_trades(for_user_id=user_id, top_k=limit)
        
        logger.info(f"✅ Ranked {len(ranked_trades)} trades for user {user_id}")
        
        # Get viewer's interests for offer matching
        viewer_interests = UserInterest.objects.filter(
            user_id=user_id
        ).select_related('genSkills_id').values_list('genSkills_id__genCateg', flat=True)
        viewer_interest_set = set(viewer_interests)
        
        # Format response
        results = []
        for entry in ranked_trades:
            trade = entry['trade']
            requester = trade.requester
            
            # ✅ Determine most compatible skill that matches viewer's interest
            offer = "Skills & Services"
            try:
                requester_skills = UserSkill.objects.filter(
                    user=requester
                ).select_related('specSkills__genSkills_id')
                
                # Priority 1: Find skill that matches viewer's interest
                best_match = None
                for skill in requester_skills:
                    if skill.specSkills and skill.specSkills.genSkills_id:
                        skill_category = skill.specSkills.genSkills_id.genCateg
                        if skill_category in viewer_interest_set:
                            best_match = skill_category
                            break  # Perfect match found
                
                # Priority 2: Use first available skill
                if not best_match:
                    first_skill = requester_skills.first()
                    if first_skill and first_skill.specSkills:
                        if first_skill.specSkills.genSkills_id:
                            best_match = first_skill.specSkills.genSkills_id.genCateg
                        elif first_skill.specSkills.specName:
                            best_match = first_skill.specSkills.specName
                
                if best_match:
                    offer = best_match
                    
            except Exception as e:
                logger.warning(f"Failed to get offer for user {requester.id}: {e}")
            
            results.append({
                'tradereq_id': trade.tradereq_id,
                'requester_id': requester.id,
                'name': f"{requester.first_name} {requester.last_name}".strip() or requester.username,
                'username': requester.username,
                'requester': requester.username,
                'reqname': trade.reqname or "",
                'need': trade.reqname or "",
                'offer': offer,
                'exchange': offer,
                'reqdeadline': trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                'deadline': trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                'profilePicUrl': requester.profilePic if getattr(requester, 'profilePic', None) else None,
                'rating': float(getattr(requester, 'avgStars', 0) or 0),
                'ratingCount': int(getattr(requester, 'ratingCount', 0) or 0),
                'level': int(getattr(requester, 'level', 1) or 1),
                'match_score': round(entry.get('score', 0), 2),
                'score_breakdown': entry.get('breakdown', {}),
                'category': trade.classified_category or 'Uncategorized',
            })
        
        response_data = {
            'ranked_trades': results,
            'count': len(results),
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, response_data, 300)
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in explore_feed: {e}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_categorize(request):
    """Categorize a trade request"""
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = CategorizeIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]

    try:
        category = categorize_tradereq(tradereq_id)
        return Response({"category": category})
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_evaluate(request):
    """
    Evaluate trade and save to database.
    Called when user clicks "Evaluate" button in Pending Trades.
    Both parties must submit details first.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = EvaluateIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]

    try:
        # Get AI evaluation
        result = evaluate_trade(tradereq_id)
        
        # Get trade request
        tradereq = TradeRequest.objects.get(pk=tradereq_id)
        
        # Get or create Evaluation record
        evaluation, created = Evaluation.objects.update_or_create(
            trade_request=tradereq,
            defaults={
                'taskcomplexity': result['taskcomplexity'],
                'timecommitment': result['timecommitment'],
                'skilllevel': result['skilllevel'],
                'evaluationdescription': result['evaluationdescription'],
            }
        )

        # Return evaluation with display-friendly scores
        return Response({
            'evaluation_id': evaluation.evaluation_id,
            'tradereq_id': tradereq_id,
            # Raw scores (0-100)
            'taskcomplexity': evaluation.taskcomplexity,
            'timecommitment': evaluation.timecommitment,
            'skilllevel': evaluation.skilllevel,
            'overall_score': evaluation.overall_score,
            # Out of 10 for UI display
            'overall_score_out_of_10': evaluation.overall_score_out_of_10,
            'taskcomplexity_out_of_10': evaluation.taskcomplexity_out_of_10,
            'timecommitment_out_of_10': evaluation.timecommitment_out_of_10,
            'skilllevel_out_of_10': evaluation.skilllevel_out_of_10,
            # Quality and description
            'quality_label': evaluation.quality_label,
            'evaluationdescription': evaluation.evaluationdescription,
            # Confirmation status
            'requester_evaluation_status': evaluation.requester_evaluation_status,
            'responder_evaluation_status': evaluation.responder_evaluation_status,
            'requester_responded_at': evaluation.requester_responded_at,
            'responder_responded_at': evaluation.responder_responded_at,
            # Metadata
            'created': created,  # True if new, False if updated
        })
        
    except Exception as e:
        # Log full traceback for debugging
        logger.error(f"API Evaluate Error for trade {tradereq_id}: {str(e)}", exc_info=True)
        
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_get_evaluation(request, tradereq_id):
    """
    Retrieve saved evaluation for a trade.
    Used in Pending Trades, Active Trades, and Messages tabs.
    """
    try:
        evaluation = Evaluation.objects.filter(
            trade_request_id=tradereq_id
        ).select_related('trade_request').order_by('-evaluation_id').first()
        
        if not evaluation:
            return Response(
                {"error": "No evaluation found for this trade. Both parties must submit details and evaluate first."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'evaluation_id': evaluation.evaluation_id,
            'tradereq_id': tradereq_id,
            # Raw scores (0-100)
            'taskcomplexity': evaluation.taskcomplexity,
            'timecommitment': evaluation.timecommitment,
            'skilllevel': evaluation.skilllevel,
            'overall_score': evaluation.overall_score,
            # Out of 10 for UI display
            'overall_score_out_of_10': evaluation.overall_score_out_of_10,
            'taskcomplexity_out_of_10': evaluation.taskcomplexity_out_of_10,
            'timecommitment_out_of_10': evaluation.timecommitment_out_of_10,
            'skilllevel_out_of_10': evaluation.skilllevel_out_of_10,
            # Quality and description
            'quality_label': evaluation.quality_label,
            'evaluationdescription': evaluation.evaluationdescription,
            # Confirmation status
            'requester_evaluation_status': evaluation.requester_evaluation_status,
            'responder_evaluation_status': evaluation.responder_evaluation_status,
            'requester_responded_at': evaluation.requester_responded_at,
            'responder_responded_at': evaluation.responder_responded_at,
        })
        
    except Exception as e:
        logger.error(f"Error getting evaluation for trade {tradereq_id}: {str(e)}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_best_match(request):
    """
    Get THE single best match for the authenticated user.
    Returns the most compatible trade based on multi-factor scoring.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    
    try:
        best_match = get_best_match(for_user_id=user_id)
        
        if best_match:
            trade = best_match['trade']
            return Response({
                "best_match": {
                    "tradereq_id": trade.pk,
                    "reqname": trade.reqname,
                    "requester": trade.requester.username,
                    "requester_id": trade.requester.pk,
                    "score": best_match['score'],
                    "category": getattr(trade, 'classified_category', None),
                    "exchange": getattr(trade, 'exchange', None),
                    "reqdeadline": getattr(trade, 'reqdeadline', None),
                    "score_breakdown": best_match['breakdown'],
                }
            })
        else:
            return Response({
                "best_match": None,
                "message": "No compatible trades found"
            })
            
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_submit_rating(request):
    """
    TR1: Submit trade rating with AI sentiment analysis.
    Called after user submits proof of completing a trade in Active Trades tab.
    Generates 1-5 star rating from review text using AI.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = SubmitRatingIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]
    review_text = serializer.validated_data["review_text"]
    
    try:
        # Get trade request
        trade = TradeRequest.objects.select_related('requester', 'responder').get(pk=tradereq_id)
        
        # Determine if current user is requester or responder
        is_requester = (request.user.pk == trade.requester.pk)
        is_responder = (request.user.pk == trade.responder.pk)
        
        if not (is_requester or is_responder):
            return Response(
                {"error": "You are not part of this trade"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user already rated
        if is_requester and trade.requester_rated:
            return Response(
                {"error": "You have already rated this trade"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if is_responder and trade.responder_rated:
            return Response(
                {"error": "You have already rated this trade"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Analyze sentiment and get star rating
        sentiment_result = analyze_sentiment(review_text)
        stars = sentiment_result['stars']
        
        # Get or create ReputationSystem record
        reputation, created = ReputationSystem.objects.get_or_create(
            trade_request=trade
        )
        
        # Update appropriate fields based on who is rating
        if is_requester:
            reputation.requester_starcount = stars
            reputation.requester_rating_desc = review_text
            reputation.requester_rated_at = timezone.now()
            trade.requester_rated = True
            partner = trade.responder
        else:  # is_responder
            reputation.responder_starcount = stars
            reputation.responder_rating_desc = review_text
            reputation.responder_rated_at = timezone.now()
            trade.responder_rated = True
            partner = trade.requester
        
        reputation.save()
        trade.save()
        
        # Update partner's average rating
        partner_ratings = ReputationSystem.objects.filter(
            trade_request__requester=partner,
            responder_starcount__isnull=False
        ).values_list('responder_starcount', flat=True).union(
            ReputationSystem.objects.filter(
                trade_request__responder=partner,
                requester_starcount__isnull=False
            ).values_list('requester_starcount', flat=True)
        )
        
        if partner_ratings:
            avg_rating = sum(partner_ratings) / len(partner_ratings)
            partner.avgStars = round(avg_rating, 2)
            partner.ratingCount = len(partner_ratings)
            partner.save()
        
        return Response({
            'success': True,
            'stars': stars,
            'sentiment': sentiment_result['sentiment'],
            'confidence': sentiment_result['confidence'],
            'review_text': review_text,
            'rated_at': reputation.requester_rated_at if is_requester else reputation.responder_rated_at,
            'partner_updated': {
                'username': partner.username,
                'new_avg_stars': float(partner.avgStars),
                'total_ratings': partner.ratingCount,
            }
        })
        
    except TradeRequest.DoesNotExist:
        return Response(
            {"error": f"Trade request {tradereq_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )