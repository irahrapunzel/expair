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


def check_ai_available():
    """Check if AI features are available"""
    if gemini_client is None:
        return False, Response(
            {"error": "AI features are currently unavailable. GEMINI_API_KEY not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    return True, None


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
    Get 6 best picks for user onboarding (SM1).
    Called after user completes signup and enters first trade request.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    
    try:
        picks = get_onboarding_best_picks(user_id)
        return Response({
            "best_picks": [
                {
                    "tradereq_id": p['trade'].pk,
                    "reqname": p['trade'].reqname,
                    "requester": p['trade'].requester.username,
                    "requester_id": p['trade'].requester.pk,
                    "score": p['score'],
                    "category": getattr(p['trade'], 'classified_category', None),
                    "exchange": getattr(p['trade'], 'exchange', None),
                    "reqdeadline": getattr(p['trade'], 'reqdeadline', None),
                }
                for p in picks
            ],
            "count": len(picks)
        })
    except Exception as e:
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_explore_feed(request):
    """
    Get ranked trades for explore page.
    Uses multi-factor ranking: AI similarity, category, location, availability.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    top_k = int(request.GET.get('top_k', 20))
    
    try:
        trades = rank_explore_trades(for_user_id=user_id, top_k=top_k)
        return Response({
            "trades": [
                {
                    "tradereq_id": t['trade'].pk,
                    "reqname": t['trade'].reqname,
                    "requester": t['trade'].requester.username,
                    "requester_id": t['trade'].requester.pk,
                    "score": t['score'],
                    "category": getattr(t['trade'], 'classified_category', None),
                    "exchange": getattr(t['trade'], 'exchange', None),
                    "reqdeadline": getattr(t['trade'], 'reqdeadline', None),
                    "score_breakdown": t['breakdown'],
                }
                for t in trades
            ],
            "count": len(trades)
        })
    except Exception as e:
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
        from accounts.models import TradeRequest
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
        evaluation = Evaluation.objects.select_related('trade_request').get(
            trade_request_id=tradereq_id
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
        
    except Evaluation.DoesNotExist:
        return Response(
            {"error": "No evaluation found for this trade. Both parties must submit details and evaluate first."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
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
